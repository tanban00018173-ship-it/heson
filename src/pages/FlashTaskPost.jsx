import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MapPin, Loader2, Check, ArrowLeft, Plus, Minus, UtensilsCrossed, Trash2, WashingMachine, Package, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

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
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsLat, setGpsLat] = useState(null);
  const [gpsLng, setGpsLng] = useState(null);

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
      base44.auth.me().then(u => setUser(u));
    });
  }, []);

  // Auto-get GPS
  useEffect(() => {
    getGPS();
  }, []);

  function getGPS() {
    setGpsLoading(true);
    if (!navigator.geolocation) { setGpsLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        setGpsLat(latitude);
        setGpsLng(longitude);
        // Reverse geocode via free API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-TW`);
          const data = await res.json();
          const addr = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setAddress(addr.split(',').slice(0, 3).join('，'));
        } catch {
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { timeout: 8000 }
    );
  }

  const currentTask = FLASH_TASKS.find(t => t.id === selected);

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

  // ── Phase: searching ──
  if (phase === 'searching') {
    return (
      <div className="fixed inset-0 bg-[#0d0d0d] flex flex-col items-center justify-center text-center px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          {/* Radar animation */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="absolute inset-0 rounded-full border-2 border-amber-500/40"
                animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                transition={{ duration: 2, delay: i * 0.6, repeat: Infinity }} />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_32px_rgba(245,158,11,0.6)]">
                <Zap className="w-8 h-8 text-black" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">雷達掃描中...</h2>
          <p className="text-stone-400 mb-1">尋找方圓 <span className="text-amber-400 font-bold">{searchRadius} 公里</span>內的小幫手</p>
          <p className="text-stone-500 text-sm mb-6">{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')} · {currentTask?.label} · NT${price}</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-stone-400 text-sm max-w-xs">
            <p><MapPin className="w-3.5 h-3.5 inline mr-1 text-amber-500" />{address}</p>
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
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">目前附近人員滿載</h2>
          <p className="text-stone-400 mb-8 leading-relaxed">
            您的報價可能低於市場行情。<br />建議<span className="text-amber-400 font-semibold">提高任務金額 $50</span> 重新發佈，以加速媒合！
          </p>
          <button onClick={() => {
            setPrice(p => p + 50);
            setPhase('form');
          }} className="w-full bg-amber-500 text-black font-black py-4 rounded-2xl text-lg hover:bg-amber-400 transition-colors mb-3 flex items-center justify-center gap-2">
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

        {/* GPS 定位 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-3">服務地點</p>
          {gpsLoading ? (
            <div className="flex items-center gap-2 text-stone-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              正在取得您的位置...
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-white text-sm leading-relaxed">{address || '無法取得 GPS 位置'}</p>
              </div>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="或手動輸入地址..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500/50"
              />
              <button onClick={getGPS} className="flex items-center gap-1 text-xs text-amber-500 mt-2 hover:text-amber-400 transition-colors">
                <RefreshCw className="w-3 h-3" /> 重新定位
              </button>
            </div>
          )}
        </div>

        {/* 任務類型 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-3">任務類型</p>
          <div className="grid grid-cols-4 gap-2">
            {FLASH_TASKS.map(task => (
              <button key={task.id} onClick={() => { setSelected(task.id); setPrice(task.base); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                  selected === task.id
                    ? 'border-amber-400 bg-amber-400/15'
                    : 'border-white/10 bg-white/5 hover:border-white/25'
                }`}>
                <task.Icon className={`w-6 h-6 ${selected === task.id ? 'text-amber-400' : 'text-stone-400'}`} />
                <span className={`text-xs font-medium ${selected === task.id ? 'text-amber-300' : 'text-stone-400'}`}>{task.label}</span>
                <span className={`text-[10px] ${selected === task.id ? 'text-amber-400' : 'text-stone-600'}`}>NT${task.base}起</span>
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
                  <span className="text-3xl font-black text-amber-400">NT${price}</span>
                </div>
                <button onClick={() => setPrice(p => p + 50)}
                  className="w-11 h-11 rounded-xl bg-amber-500 text-black text-xl font-bold hover:bg-amber-400 transition-colors flex items-center justify-center">
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
              ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_32px_rgba(245,158,11,0.35)]'
              : 'bg-white/10 text-stone-600 cursor-not-allowed'
          }`}>
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          {submitting ? '發佈中...' : selected ? `確認 NT$${price} · 尋找小幫手` : '請先選擇任務類型'}
        </button>
        <p className="text-center text-[11px] text-stone-600 mt-2">任務無人接單將自動退款 · 0 手續費</p>
      </div>
    </div>
  );
}