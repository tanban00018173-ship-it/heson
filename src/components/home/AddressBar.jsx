import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Home, Building2, HelpCircle, PlusCircle, X, Check, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import RegionPicker, { TW_DATA } from '@/components/profile/RegionPicker';
import StreetEditSheet from '@/components/profile/StreetEditSheet';

const CLEANING_TYPES = ['居家地址', '公司地址', '其他地址'];
const ADDRESS_ICONS = {
  '居家地址': Home,
  '公司地址': Building2,
  '其他地址': HelpCircle,
};

function EditSheet({ open, title, value, onClose, onSave, inputType = 'text', placeholder = '' }) {
  const [draft, setDraft] = React.useState(value || '');
  React.useEffect(() => { if (open) setDraft(value || ''); }, [open, value]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
        <div className="relative flex items-center justify-center">
          <h2 className="text-base font-bold text-stone-900">編輯{title}</h2>
          <button onClick={onClose} className="absolute right-0 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100">
            <X className="w-4 h-4 text-stone-600" />
          </button>
        </div>
        <input
          type={inputType}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
          autoFocus
        />
        <button
          onClick={() => onSave(draft)}
          className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl hover:bg-stone-800 transition-colors"
        >
          儲存
        </button>
      </div>
    </div>
  );
}

export default function AddressBar({ address: initialAddress = '台北市・居家服務', onAddressChange }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddrObj, setSelectedAddrObj] = useState(null);
  const [displayAddress, setDisplayAddress] = useState(initialAddress);
  const [showPicker, setShowPicker] = useState(false);

  // 新增地址 flow
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({ address_type: '居家地址', full_name: '', phone: '', city: '', district: '', postal_code: '', street: '', is_default: false });
  const [newAddrStep, setNewAddrStep] = useState('form');
  const [editField, setEditField] = useState(null);
  const [savingNew, setSavingNew] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) return;
      base44.auth.me().then(async (u) => {
        setUser(u);
        const addrs = await base44.entities.UserAddress.filter({ user_id: u.id });
        const cleaning = addrs.filter(a => CLEANING_TYPES.includes(a.address_type));
        setSavedAddresses(cleaning);
        const def = cleaning.find(a => a.is_default) || cleaning[0];
        if (def) {
          setSelectedAddrObj(def);
          const label = `${def.district || def.city}・${def.street?.slice(0, 8) || '居家服務'}`;
          setDisplayAddress(label);
          onAddressChange?.(def);
        }
      });
    });
  }, []);

  const applyAddress = (addrObj) => {
    setSelectedAddrObj(addrObj);
    const label = `${addrObj.district || addrObj.city}・${addrObj.street?.slice(0, 8) || '居家服務'}`;
    setDisplayAddress(label);
    onAddressChange?.(addrObj);
    setShowPicker(false);
  };

  const refreshAddresses = async (uid) => {
    const addrs = await base44.entities.UserAddress.filter({ user_id: uid });
    const cleaning = addrs.filter(a => CLEANING_TYPES.includes(a.address_type));
    setSavedAddresses(cleaning);
    return cleaning;
  };

  const handleSaveNewAddr = async () => {
    if (!user || !newAddr.full_name || !newAddr.phone || !newAddr.street) return;
    setSavingNew(true);
    try {
      const saved = await base44.entities.UserAddress.create({ ...newAddr, user_id: user.id });
      await refreshAddresses(user.id);
      applyAddress(saved);
      setShowNewAddr(false);
      setNewAddr({ address_type: '居家地址', full_name: '', phone: '', city: '', district: '', postal_code: '', street: '', is_default: false });
    } finally {
      setSavingNew(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 bg-white">
        <button
          onClick={() => user ? setShowPicker(true) : navigate('/ClientAddressList')}
          className="flex items-center gap-1.5 max-w-[75%]"
        >
          <MapPin className="w-4 h-4 text-stone-700 flex-shrink-0" />
          <span className="text-sm font-semibold text-stone-800 truncate">{displayAddress}</span>
          <ChevronDown className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
        </button>
      </div>

      {/* 地址選擇 Picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div className="fixed inset-0 z-50 flex flex-col justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowPicker(false)} />
            <motion.div
              className="relative bg-white rounded-t-3xl pb-8"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-stone-100">
                <h2 className="text-base font-bold text-stone-900">選擇清潔地址</h2>
                <button onClick={() => setShowPicker(false)} className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-stone-600" />
                </button>
              </div>
              <div className="px-5 pt-3 space-y-2 max-h-80 overflow-y-auto">
                {/* 新增地址 */}
                <button
                  onClick={() => { setShowNewAddr(true); setNewAddrStep('form'); }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-dashed border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all text-left"
                >
                  <div className="w-9 h-9 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <PlusCircle className="w-5 h-5 text-stone-600" />
                  </div>
                  <p className="text-sm text-stone-700 font-medium">新增清潔地址</p>
                </button>

                {savedAddresses.map(addr => {
                  const Icon = ADDRESS_ICONS[addr.address_type] || HelpCircle;
                  const fullAddr = `${addr.city}${addr.district}${addr.street}`;
                  const isSelected = selectedAddrObj?.id === addr.id;
                  return (
                    <button
                      key={addr.id}
                      onClick={() => applyAddress(addr)}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border transition-all text-left ${isSelected ? 'bg-stone-900 border-stone-900' : 'bg-stone-50 border-stone-100 hover:border-stone-300'}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? 'bg-white/20' : 'bg-white'}`}>
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-stone-600'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs mb-0.5 ${isSelected ? 'text-stone-400' : 'text-stone-400'}`}>{addr.address_type}{addr.is_default ? ' · 預設' : ''}</p>
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-stone-800'}`}>{addr.full_name}</p>
                        <p className={`text-xs truncate ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>{fullAddr}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0 mt-1 ml-auto" />}
                    </button>
                  );
                })}

                {savedAddresses.length === 0 && (
                  <p className="text-center text-sm text-stone-400 py-6">尚未儲存清潔地址，請新增</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 新增地址 Sheet */}
      <AnimatePresence>
        {showNewAddr && (
          <motion.div className="fixed inset-0 z-[60] flex flex-col justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowNewAddr(false)} />
            <motion.div
              className="relative bg-white rounded-t-3xl flex flex-col"
              style={{ maxHeight: '90vh' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0 border-b border-stone-100">
                <h2 className="text-base font-bold text-stone-900">新增清潔地址</h2>
                <button onClick={() => setShowNewAddr(false)} className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-stone-600" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pb-6">
                {/* 地址類型 */}
                <p className="px-5 py-3 text-xs text-stone-500 font-semibold uppercase tracking-wider">地址類型</p>
                <div className="px-5 flex gap-2 flex-wrap mb-2">
                  {CLEANING_TYPES.map(type => (
                    <button key={type} onClick={() => setNewAddr(f => ({ ...f, address_type: type }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${newAddr.address_type === type ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'}`}>
                      {type}
                    </button>
                  ))}
                </div>

                {/* 聯絡人 */}
                <p className="px-5 py-3 text-xs text-stone-500 font-semibold uppercase tracking-wider">聯絡人資訊</p>
                <div className="bg-stone-50 mx-5 rounded-2xl overflow-hidden mb-2 border border-stone-100">
                  <button onClick={() => setEditField({ key: 'full_name', title: '全名', value: newAddr.full_name, inputType: 'text', placeholder: '請輸入全名' })}
                    className="w-full flex items-center justify-between px-4 py-3.5 border-b border-stone-100 hover:bg-stone-100 transition-colors">
                    <span className="text-sm text-stone-500">全名</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-stone-800">{newAddr.full_name || '—'}</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </button>
                  <button onClick={() => setEditField({ key: 'phone', title: '手機號碼', value: newAddr.phone, inputType: 'tel', placeholder: '請輸入手機號碼' })}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-100 transition-colors">
                    <span className="text-sm text-stone-500">手機號碼</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-stone-800">{newAddr.phone || '—'}</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </button>
                </div>

                {/* 地址 */}
                <p className="px-5 py-3 text-xs text-stone-500 font-semibold uppercase tracking-wider">地址資訊</p>
                <div className="bg-stone-50 mx-5 rounded-2xl overflow-hidden mb-4 border border-stone-100">
                  <button onClick={() => setNewAddrStep('region')}
                    className="w-full flex items-center justify-between px-4 py-3.5 border-b border-stone-100 hover:bg-stone-100 transition-colors">
                    <span className="text-sm text-stone-500">城市／區</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-stone-800">{newAddr.city && newAddr.district ? `${newAddr.city} ${newAddr.district}` : '—'}</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </button>
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-100">
                    <span className="text-sm text-stone-500">郵遞區號</span>
                    <span className="text-sm text-stone-400">{newAddr.postal_code || '—'}</span>
                  </div>
                  <button onClick={() => setNewAddrStep('street')}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-100 transition-colors">
                    <span className="text-sm text-stone-500">街道,巷弄,門號</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-stone-800 max-w-[160px] truncate text-right">{newAddr.street || '—'}</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </button>
                </div>

                <div className="px-5">
                  <button
                    onClick={handleSaveNewAddr}
                    disabled={savingNew || !newAddr.full_name || !newAddr.phone || !newAddr.street}
                    className="w-full bg-stone-900 text-white font-black py-4 rounded-2xl hover:bg-stone-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
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

      {/* RegionPicker */}
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

      {/* StreetEditSheet */}
      <StreetEditSheet
        open={newAddrStep === 'street'}
        city={newAddr.city}
        district={newAddr.district}
        initialStreet={newAddr.street}
        initialLat={newAddr.gps_lat}
        initialLng={newAddr.gps_lng}
        onClose={() => setNewAddrStep('form')}
        onSave={({ street, gps_lat, gps_lng, city: newCity, district: newDistrict }) => {
          setNewAddr(f => {
            const resolvedCity = newCity || f.city;
            const resolvedDistrict = newDistrict || f.district;
            const postal_code = TW_DATA[resolvedCity]?.[resolvedDistrict] || f.postal_code;
            return { ...f, street, gps_lat, gps_lng, city: resolvedCity, district: resolvedDistrict, postal_code };
          });
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
    </>
  );
}