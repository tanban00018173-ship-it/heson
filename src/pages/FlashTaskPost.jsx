import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MapPin, Loader2, Check, ArrowLeft, Plus, Minus, UtensilsCrossed, Trash2, WashingMachine, Package, AlertTriangle, Home, Building2, HelpCircle, ChevronRight, PlusCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import RegionPicker, { TW_DATA } from '@/components/profile/RegionPicker';
import StreetEditSheet from '@/components/profile/StreetEditSheet';
import EditSheet from '@/components/profile/EditSheet';

const CLEANING_TYPES = ['居家地址', '公司地址', '其他地址'];
const ADDRESS_ICONS = {
  '居家地址': Home,
  '公司地址': Building2,
  '其他地址': HelpCircle,
};

const FLASH_TASKS = [
  { id: 'dishes',  Icon: UtensilsCrossed, label: '洗碗',   base: 200 },
  { id: 'trash',   Icon: Trash2,          label: '倒垃圾', base: 150 },
  { id: 'laundry', Icon: WashingMachine,  label: '洗曬衣', base: 250 },
  { id: 'moving',  Icon: Package,         label: '微清運', base: 350 },
];



export default function FlashTaskPost() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [phase, setPhase] = useState('form');
  const [address, setAddress] = useState('');
  const [gpsLat, setGpsLat] = useState(null);
  const [gpsLng, setGpsLng] = useState(null);
  const [selectedAddrObj, setSelectedAddrObj] = useState(null); // 完整地址物件
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // 新增地址 flow
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({ address_type: '居家地址', full_name: '', phone: '', city: '', district: '', postal_code: '', street: '', is_default: false });
  const [newAddrStep, setNewAddrStep] = useState('form'); // form | region | street
  const [editField, setEditField] = useState(null);
  const [savingNew, setSavingNew] = useState(false);

  // Read pre-selected task from URL
  const params = new URLSearchParams(window.location.search);
  const preTask = params.get('task');
  const prePrice = parseInt(params.get('price') || '0');

  const [selected, setSelected] = useState(preTask || null);
  const [price, setPrice] = useState(prePrice || 200);
  const [submitting, setSubmitting] = useState(false);

  const searchTimer1 = useRef(null);
  const searchTimer2 = useRef(null);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [searchRadius, setSearchRadius] = useState(3);
  const searchInterval = useRef(null);
  const [createdBookingId, setCreatedBookingId] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) { base44.auth.redirectToLogin(); return; }
      base44.auth.me().then(u => {
        setUser(u);
        // 載入已儲存的清潔地址，並自動套用預設地址
        base44.entities.UserAddress.filter({ user_id: u.id }).then(addrs => {
          const cleaning = addrs.filter(a => CLEANING_TYPES.includes(a.address_type));
          setSavedAddresses(cleaning);
          // 自動選擇預設地址
          const def = cleaning.find(a => a.is_default) || cleaning[0];
          if (def) {
            setSelectedAddrObj(def);
            setAddress(`${def.city}${def.district}${def.street}`);
            if (def.gps_lat) setGpsLat(def.gps_lat);
            if (def.gps_lng) setGpsLng(def.gps_lng);
          }
        });
      });
    });
  }, []);

  const currentTask = FLASH_TASKS.find(t => t.id === selected);

  const applyAddress = (addrObj) => {
    setSelectedAddrObj(addrObj);
    setAddress(`${addrObj.city}${addrObj.district}${addrObj.street}`);
    if (addrObj.gps_lat) setGpsLat(addrObj.gps_lat);
    if (addrObj.gps_lng) setGpsLng(addrObj.gps_lng);
    setShowAddressPicker(false);
  };

  async function handleSubmit() {
    if (!selected || !address) { toast.error('請選擇任務類型與地址'); return; }
    setSubmitting(true);
    try {
      const booking = await base44.entities.Booking.create({
        client_id: user.id,
        client_name: user.full_name,
        service_type: currentTask.label,
        status: '待確認',
        is_flash_task: true,
        flash_expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        scheduled_date: new Date().toISOString().split('T')[0],
        time_slot: '上午 08:00-12:00',
        address,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        amount: price,
        notes: `閃電任務 · ${currentTask.label} · NT$${price}`,
      });
      setCreatedBookingId(booking.id);
      setPhase('searching');
      setSearchSeconds(0);
      setSearchRadius(3);

      // Timer: 10min → expand to 5km
      searchTimer1.current = setTimeout(() => setSearchRadius(5), 10 * 60 * 1000);
      // Timer: 20min → expire
      searchTimer2.current = setTimeout(async () => {
        await base44.entities.Booking.update(booking.id, { status: '已取消' });
        setPhase('expired');
        clearInterval(searchInterval.current);
      }, 20 * 60 * 1000);

      // Countdown display
      searchInterval.current = setInterval(() => setSearchSeconds(s => s + 1), 1000);

      // Poll for acceptance
      const poll = setInterval(async () => {
        const [b] = await base44.entities.Booking.filter({ id: booking.id });
        if (b?.status === '已確認') {
          clearInterval(poll);
          clearTimeout(searchTimer1.current);
          clearTimeout(searchTimer2.current);
          clearInterval(searchInterval.current);
          setPhase('matched');
        }
      }, 5000);

    } catch (e) {
      toast.error('發佈失敗，請稍後重試');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => () => {
    clearTimeout(searchTimer1.current);
    clearTimeout(searchTimer2.current);
    clearInterval(searchInterval.current);
  }, []);

  const mins = Math.floor(searchSeconds / 60);
  const secs = searchSeconds % 60;

  const refreshSavedAddresses = async (uid) => {
    const addrs = await base44.entities.UserAddress.filter({ user_id: uid });
    setSavedAddresses(addrs.filter(a => CLEANING_TYPES.includes(a.address_type)));
  };

  const handleSaveNewAddr = async () => {
    if (!user || !newAddr.full_name || !newAddr.phone || !newAddr.street) {
      toast.error('請填寫完整資料'); return;
    }
    setSavingNew(true);
    try {
      const saved = await base44.entities.UserAddress.create({ ...newAddr, user_id: user.id });
      await refreshSavedAddresses(user.id);
      applyAddress(saved);
      setShowNewAddr(false);
      setShowAddressPicker(false);
      setNewAddr({ address_type: '居家地址', full_name: '', phone: '', city: '', district: '', postal_code: '', street: '', is_default: false });
      toast.success('地址已新增並套用');
    } catch {
      toast.error('儲存失敗，請重試');
    } finally {
      setSavingNew(false);
    }
  };

  // ── Phase: searching ──
  if (phase === 'searching') {
    return (
      <div className="fixed inset-0 bg-[#0d0d0d] flex flex-col items-center justify-center text-center px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          {/* Radar animation */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="absolute inset-0 rounded-full border-2 border-gold-500/40"
                animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                transition={{ duration: 2, delay: i * 0.6, repeat: Infinity }} />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center shadow-[0_0_32px_rgba(201,168,76,0.6)]">
                <Zap className="w-8 h-8 text-black" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">雷達掃描中...</h2>
          <p className="text-stone-400 mb-1">尋找方圓 <span className="text-gold-400 font-bold">{searchRadius} 公里</span>內的小幫手</p>
          <p className="text-stone-500 text-sm mb-6">{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')} · {currentTask?.label} · NT${price}</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-stone-400 text-sm max-w-xs">
            <p><MapPin className="w-3.5 h-3.5 inline mr-1 text-gold-500" />{address}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Phase: expired ──
  if (phase === 'expired') {
    return (
      <div className="fixed inset-0 bg-[#0d0d0d] flex flex-col items-center justify-center text-center px-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm w-full">
          <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-gold-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">目前附近人員滿載</h2>
          <p className="text-stone-400 mb-8 leading-relaxed">
            您的報價可能低於市場行情。<br />建議<span className="text-amber-400 font-semibold">提高任務金額 $50</span> 重新發佈，以加速媒合！
          </p>
          <button onClick={() => {
            setPrice(p => p + 50);
            setPhase('form');
          }} className="w-full bg-gold-500 text-black font-black py-4 rounded-2xl text-lg hover:bg-gold-400 transition-colors mb-3 flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> 一鍵加價 NT${price + 50} 重發
          </button>
          <button onClick={() => navigate('/')} className="w-full text-stone-500 py-3 text-sm hover:text-stone-300 transition-colors">
            返回首頁
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Phase: matched ──
  if (phase === 'matched') {
    return (
      <div className="fixed inset-0 bg-[#0d0d0d] flex flex-col items-center justify-center text-center px-6">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="max-w-sm w-full">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_48px_rgba(34,197,94,0.5)]">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">已找到小幫手！</h2>
          <p className="text-stone-400 mb-8">正在前往您的位置，請稍候片刻</p>
          <button onClick={() => navigate('/MyBookings')} className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-stone-100 transition-colors">
            查看訂單詳情
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Phase: form ──
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-safe pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-white">發佈閃電任務</h1>
          <p className="text-stone-500 text-xs">極速媒合，10 分鐘內確認</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-4">

        {/* 服務地點 */}
        <button
          onClick={() => setShowAddressPicker(true)}
          className="w-full text-left group"
        >
          <p className="text-xs text-stone-500 font-semibold uppercase tracking-widest mb-2 px-1">服務地點</p>
          <div className={`rounded-2xl p-4 border transition-all ${selectedAddrObj ? 'bg-white/5 border-white/10 group-hover:border-gold-500/50' : 'bg-white/3 border-dashed border-white/15 group-hover:border-gold-500/40'}`}>
            {selectedAddrObj ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gold-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  {React.createElement(ADDRESS_ICONS[selectedAddrObj.address_type] || HelpCircle, { className: 'w-5 h-5 text-gold-400' })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-white truncate">{selectedAddrObj.full_name}</p>
                    {selectedAddrObj.is_default && (
                      <span className="text-[10px] font-semibold bg-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded-full flex-shrink-0">預設</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 truncate">{address}</p>
                  <p className="text-[11px] text-stone-600 mt-0.5">{selectedAddrObj.address_type}</p>
                </div>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  {selectedAddrObj.gps_lat && <MapPin className="w-3.5 h-3.5 text-gold-500" />}
                  <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-gold-400 transition-colors" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-stone-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-400">選擇或新增服務地址</p>
                  <p className="text-xs text-stone-600 mt-0.5">點此設定清潔地點</p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-600 flex-shrink-0" />
              </div>
            )}
          </div>
        </button>

        {/* 任務類型 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-3">任務類型</p>
          <div className="grid grid-cols-4 gap-2">
            {FLASH_TASKS.map(task => (
              <button key={task.id} onClick={() => { setSelected(task.id); setPrice(task.base); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                  selected === task.id
                    ? 'border-gold-400 bg-gold-400/15'
                    : 'border-white/10 bg-white/5 hover:border-white/25'
                }`}>
                <task.Icon className={`w-6 h-6 ${selected === task.id ? 'text-gold-400' : 'text-stone-400'}`} />
                <span className={`text-xs font-medium ${selected === task.id ? 'text-gold-300' : 'text-stone-400'}`}>{task.label}</span>
                <span className={`text-[10px] ${selected === task.id ? 'text-gold-400' : 'text-stone-600'}`}>NT${task.base}起</span>
              </button>
            ))}
          </div>
        </div>

        {/* 價格設定 */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 overflow-hidden">
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-1">任務金額</p>
              <p className="text-[11px] text-stone-600 mb-3">加價可讓小幫手優先接您的單（底價 NT${currentTask?.base}）</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setPrice(p => Math.max(currentTask.base, p - 50))}
                  className="w-11 h-11 rounded-xl bg-white/10 text-white text-xl font-bold hover:bg-white/20 transition-colors flex items-center justify-center">
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-black text-gold-400">NT${price}</span>
                </div>
                <button onClick={() => setPrice(p => p + 50)}
                  className="w-11 h-11 rounded-xl bg-gold-500 text-black text-xl font-bold hover:bg-gold-400 transition-colors flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部 CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent pb-safe">
        <button onClick={handleSubmit} disabled={!selected || !address || submitting}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
            selected && address && !submitting
              ? 'bg-gold-500 text-black hover:bg-gold-400 shadow-[0_0_32px_rgba(201,168,76,0.35)]'
              : 'bg-white/10 text-stone-600 cursor-not-allowed'
          }`}>
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          {submitting ? '發佈中...' : selected ? `確認 NT$${price} · 尋找小幫手` : '請先選擇任務類型'}
        </button>
        <p className="text-center text-[11px] text-stone-600 mt-2">任務無人接單將自動退款 · 0 手續費</p>
      </div>

      {/* 新增地址 Sheet */}
      <AnimatePresence>
        {showNewAddr && (
          <motion.div className="fixed inset-0 z-[60] flex flex-col justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowNewAddr(false)} />
            <motion.div
              className="relative bg-[#1a1a1a] rounded-t-3xl flex flex-col"
              style={{ maxHeight: '90vh' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
                <h2 className="text-base font-bold text-white">新增服務地址</h2>
                <button onClick={() => setShowNewAddr(false)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pb-6">
                {/* 地址類型 */}
                <p className="px-5 py-2 text-xs text-stone-500 font-semibold uppercase tracking-wider">地址類型</p>
                <div className="px-5 flex gap-2 flex-wrap mb-2">
                  {CLEANING_TYPES.map(type => (
                    <button key={type} onClick={() => setNewAddr(f => ({ ...f, address_type: type }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${newAddr.address_type === type ? 'bg-gold-500 text-black border-gold-500' : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/25'}`}>
                      {type}
                    </button>
                  ))}
                </div>

                {/* 聯絡人 */}
                <p className="px-5 py-2 text-xs text-stone-500 font-semibold uppercase tracking-wider">聯絡人資訊</p>
                <div className="bg-white/5 mx-5 rounded-2xl overflow-hidden mb-2">
                  <button onClick={() => setEditField({ key: 'full_name', title: '全名', value: newAddr.full_name, inputType: 'text', placeholder: '請輸入全名' })}
                    className="w-full flex items-center justify-between px-4 py-3.5 border-b border-white/5 hover:bg-white/5 transition-colors">
                    <span className="text-sm text-stone-400">全名</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white">{newAddr.full_name || '—'}</span>
                      <ChevronRight className="w-4 h-4 text-stone-600 flex-shrink-0" />
                    </div>
                  </button>
                  <button onClick={() => setEditField({ key: 'phone', title: '手機號碼', value: newAddr.phone, inputType: 'tel', placeholder: '請輸入手機號碼' })}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors">
                    <span className="text-sm text-stone-400">手機號碼</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white">{newAddr.phone || '—'}</span>
                      <ChevronRight className="w-4 h-4 text-stone-600 flex-shrink-0" />
                    </div>
                  </button>
                </div>

                {/* 地址 */}
                <p className="px-5 py-2 text-xs text-stone-500 font-semibold uppercase tracking-wider">地址資訊</p>
                <div className="bg-white/5 mx-5 rounded-2xl overflow-hidden mb-2">
                  <button onClick={() => setNewAddrStep('region')}
                    className="w-full flex items-center justify-between px-4 py-3.5 border-b border-white/5 hover:bg-white/5 transition-colors">
                    <span className="text-sm text-stone-400">城市／區</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white">{newAddr.city && newAddr.district ? `${newAddr.city} ${newAddr.district}` : '—'}</span>
                      <ChevronRight className="w-4 h-4 text-stone-600 flex-shrink-0" />
                    </div>
                  </button>
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5">
                    <span className="text-sm text-stone-400">郵遞區號</span>
                    <span className="text-sm text-stone-500">{newAddr.postal_code || '—'}</span>
                  </div>
                  <button onClick={() => setNewAddrStep('street')}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors">
                    <span className="text-sm text-stone-400">街道,巷弄,門號</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white max-w-[160px] truncate text-right">{newAddr.street || '—'}</span>
                      <ChevronRight className="w-4 h-4 text-stone-600 flex-shrink-0" />
                    </div>
                  </button>
                </div>

                {/* 儲存按鈕 */}
                <div className="px-5 pt-2">
                  <button
                    onClick={handleSaveNewAddr}
                    disabled={savingNew || !newAddr.full_name || !newAddr.phone || !newAddr.street}
                    className="w-full bg-gold-500 text-black font-black py-4 rounded-2xl hover:bg-gold-400 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                  >
                    {savingNew ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {savingNew ? '儲存中...' : '儲存並套用此地址'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RegionPicker for new address */}
      <RegionPicker
        open={newAddrStep === 'region'}
        city={newAddr.city}
        district={newAddr.district}
        onClose={() => setNewAddrStep('form')}
        onConfirm={({ city, district, postal_code }) => {
          setNewAddr(f => ({ ...f, city, district, postal_code }));
          setNewAddrStep('form');
        }}
      />

      {/* StreetEditSheet for new address */}
      <StreetEditSheet
        open={newAddrStep === 'street'}
        city={newAddr.city}
        district={newAddr.district}
        initialStreet={newAddr.street}
        initialLat={newAddr.gps_lat}
        initialLng={newAddr.gps_lng}
        onClose={() => setNewAddrStep('form')}
        onSave={({ street, gps_lat, gps_lng, city: newCity, district: newDistrict }) => {
          setNewAddr(f => ({ ...f, street, gps_lat, gps_lng, city: newCity || f.city, district: newDistrict || f.district }));
          setNewAddrStep('form');
        }}
      />

      {/* EditSheet for name/phone */}
      <EditSheet
        open={!!editField}
        title={editField?.title || ''}
        value={editField?.value || ''}
        inputType={editField?.inputType || 'text'}
        placeholder={editField?.placeholder || ''}
        onClose={() => setEditField(null)}
        onSave={(v) => {
          setNewAddr(f => ({ ...f, [editField.key]: v }));
          setEditField(null);
        }}
      />

      {/* 已儲存地址選擇器 */}
      <AnimatePresence>
        {showAddressPicker && (
          <motion.div className="fixed inset-0 z-50 flex flex-col justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddressPicker(false)} />
            <motion.div
              className="relative bg-[#1a1a1a] rounded-t-3xl pb-8"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">選擇服務地址</h2>
                <button onClick={() => setShowAddressPicker(false)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="px-5 space-y-2 max-h-72 overflow-y-auto">
                {/* 新增地址按鈕 */}
                <button
                  onClick={() => { setShowNewAddr(true); setNewAddrStep('form'); }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-dashed border-white/20 hover:border-gold-400/50 hover:bg-gold-400/5 transition-all text-left"
                >
                  <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                    <PlusCircle className="w-5 h-5 text-gold-400" />
                  </div>
                  <p className="text-sm text-gold-400 font-medium">新增地址</p>
                </button>
                {savedAddresses.map(addr => {
                  const Icon = ADDRESS_ICONS[addr.address_type] || HelpCircle;
                  const fullAddr = `${addr.city}${addr.district}${addr.street}`;
                  return (
                    <button
                      key={addr.id}
                      onClick={() => applyAddress(addr)}
                      className="w-full flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/40 transition-all text-left"
                    >
                      <div className="w-9 h-9 bg-gold-500/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4.5 h-4.5 text-gold-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-stone-400 mb-0.5">{addr.address_type}{addr.is_default ? ' · 預設' : ''}</p>
                        <p className="text-sm text-white font-medium truncate">{addr.full_name}</p>
                        <p className="text-xs text-stone-400 truncate">{fullAddr}</p>
                      </div>
                      {addr.gps_lat && <MapPin className="w-3.5 h-3.5 text-gold-500 flex-shrink-0 mt-1 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}