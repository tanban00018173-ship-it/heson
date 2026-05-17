import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, MapPin } from "lucide-react";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import EditSheet from "@/components/profile/EditSheet";
import RegionPicker, { TW_DATA } from "@/components/profile/RegionPicker";
import AddressMapModal from "@/components/AddressMapModal";
import StreetEditSheet from "@/components/profile/StreetEditSheet";



const CLEANING_TYPES = ['居家地址', '公司地址', '其他地址'];
const PICKUP_TYPES = ['超商取貨地址'];
const TYPE_OPTIONS = {
  cleaning: ['居家地址', '公司地址', '其他地址'],
  pickup: ['超商取貨地址'],
};

function RowItem({ label, value, onEdit }) {
  return (
    <button
      onClick={onEdit}
      className="w-full flex items-center justify-between px-4 py-3.5 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors"
    >
      <span className="text-sm text-stone-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-stone-800">{value || '—'}</span>
        <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
      </div>
    </button>
  );
}

export default function ClientAddressForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const addressId = urlParams.get('id');
  const section = urlParams.get('section') || 'cleaning';
  const defaultType = urlParams.get('type') || TYPE_OPTIONS[section]?.[0] || '居家地址';

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    address_type: defaultType,
    full_name: '',
    phone: '',
    city: '',
    district: '',
    postal_code: '',
    street: '',
    is_default: false,
  });
  const [saving, setSaving] = useState(false);
  const [editField, setEditField] = useState(null);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [showStreetEdit, setShowStreetEdit] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      if (!auth) { base44.auth.redirectToLogin(); return; }
      base44.auth.me().then(setUser);
    });
  }, []);

  const { data: existingAddress } = useQuery({
    queryKey: ['userAddress', addressId],
    queryFn: () => base44.entities.UserAddress.filter({ id: addressId }),
    enabled: !!addressId,
  });

  useEffect(() => {
    if (existingAddress?.[0]) setForm({ ...existingAddress[0] });
  }, [existingAddress]);

  const doSave = async () => {
    if (!user) return;
    setSaving(true);
    const data = { ...form, user_id: user.id };

    if (form.is_default) {
      const allAddresses = await base44.entities.UserAddress.filter({ user_id: user.id });
      const isCleaning = CLEANING_TYPES.includes(form.address_type);
      const toReset = allAddresses.filter(a => {
        const aIsCleaning = CLEANING_TYPES.includes(a.address_type);
        return aIsCleaning === isCleaning && a.id !== addressId && a.is_default;
      });
      await Promise.all(toReset.map(a => base44.entities.UserAddress.update(a.id, { is_default: false })));
    }

    if (addressId) {
      await base44.entities.UserAddress.update(addressId, data);
    } else {
      await base44.entities.UserAddress.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['userAddresses', user.id] });
    navigate('/ClientAddressList');
    setSaving(false);
  };

  const handleSave = async () => {
    if (!user) return;
    await doSave();
  };

  const handleMapConfirm = async ({ lat, lng }) => {
    const updatedForm = { ...form, gps_lat: lat, gps_lng: lng };
    setForm(updatedForm);
    setShowMapModal(false);
    if (pendingSave) {
      setPendingSave(false);
      // 用 updatedForm 直接儲存，不等 state 更新
      if (!user) return;
      setSaving(true);
      const data = { ...updatedForm, user_id: user.id };
      if (updatedForm.is_default) {
        const allAddresses = await base44.entities.UserAddress.filter({ user_id: user.id });
        const isCleaning = CLEANING_TYPES.includes(updatedForm.address_type);
        const toReset = allAddresses.filter(a => {
          const aIsCleaning = CLEANING_TYPES.includes(a.address_type);
          return aIsCleaning === isCleaning && a.id !== addressId && a.is_default;
        });
        await Promise.all(toReset.map(a => base44.entities.UserAddress.update(a.id, { is_default: false })));
      }
      if (addressId) {
        await base44.entities.UserAddress.update(addressId, data);
      } else {
        await base44.entities.UserAddress.create(data);
      }
      queryClient.invalidateQueries({ queryKey: ['userAddresses', user.id] });
      navigate('/ClientAddressList');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!addressId) return;
    await base44.entities.UserAddress.delete(addressId);
    queryClient.invalidateQueries({ queryKey: ['userAddresses', user?.id] });
    navigate('/ClientAddressList');
  };

  const handleEditSave = (key, newValue) => {
    if (key === 'city') {
      const districts = TW_DATA[newValue] || {};
      const firstDistrict = Object.keys(districts)[0] || '';
      setForm(f => ({ ...f, city: newValue, district: firstDistrict, postal_code: districts[firstDistrict] || '' }));
    } else if (key === 'district') {
      const postalCode = TW_DATA[form.city]?.[newValue] || '';
      setForm(f => ({ ...f, district: newValue, postal_code: postalCode }));
    } else {
      setForm(f => ({ ...f, [key]: newValue }));
    }
    setEditField(null);
  };

  const typeOptions = CLEANING_TYPES.includes(form.address_type) ? CLEANING_TYPES : PICKUP_TYPES;

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col">
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-stone-900">地址</h1>
        {addressId ? (
          <button onClick={handleDelete} className="text-sm text-red-500 font-medium px-2">刪除</button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-36">
        {/* 地址類型 */}
        <p className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">地址類型</p>
        <div className="bg-white px-4 py-3 flex gap-2 flex-wrap">
          {typeOptions.map(type => (
            <button
              key={type}
              onClick={() => setForm(f => ({ ...f, address_type: type }))}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${form.address_type === type ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* 聯絡人資訊 */}
        <p className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">聯絡人資訊</p>
        <div className="bg-white rounded-none overflow-hidden">
          <RowItem label="全名" value={form.full_name}
            onEdit={() => setEditField({ key: 'full_name', title: '全名', value: form.full_name, inputType: 'text', placeholder: '請輸入全名' })} />
          <RowItem label="手機號碼" value={form.phone}
            onEdit={() => setEditField({ key: 'phone', title: '手機號碼', value: form.phone, inputType: 'tel', placeholder: '請輸入手機號碼' })} />
        </div>

        {/* 地址資訊 */}
        <p className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">地址資訊</p>
        <div className="bg-white rounded-none overflow-hidden">
          <button
            onClick={() => setShowRegionPicker(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 border-b border-stone-50 hover:bg-stone-50 transition-colors"
          >
            <span className="text-sm text-stone-500">城市／區</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-stone-800">
                {form.city && form.district ? `${form.city} ${form.district}` : '—'}
              </span>
              <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
            </div>
          </button>
          <button className="w-full flex items-center justify-between px-4 py-3.5 border-b border-stone-50 last:border-0 cursor-default">
            <span className="text-sm text-stone-500">郵遞區號</span>
            <span className="text-sm font-medium text-stone-400">{form.postal_code || '—'}</span>
          </button>
          <RowItem label="街道,巷弄,門號" value={form.street}
            onEdit={() => setShowStreetEdit(true)} />
        </div>

        {/* 預設地址開關 */}
        <p className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">偏好設定</p>
        <div className="bg-white">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-stone-800">設定為預設地址</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {CLEANING_TYPES.includes(form.address_type) ? '清潔地址' : '超商取貨地址'}預設
              </p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, is_default: !f.is_default }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.is_default ? 'bg-stone-900' : 'bg-stone-200'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_default ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* 儲存按鈕 */}
        <div className="px-4 pt-6 pb-4">
          <button
            onClick={handleSave}
            disabled={saving || !form.full_name || !form.phone || !form.street}
            className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl hover:bg-stone-700 disabled:opacity-40 transition-colors"
          >
            {saving ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>

      <ClientBottomNav />

      <StreetEditSheet
        open={showStreetEdit}
        city={form.city}
        district={form.district}
        initialStreet={form.street}
        initialLat={form.gps_lat}
        initialLng={form.gps_lng}
        onClose={() => setShowStreetEdit(false)}
        onSave={({ street, gps_lat, gps_lng }) => {
          setForm(f => ({ ...f, street, gps_lat, gps_lng }));
          setShowStreetEdit(false);
        }}
      />

      <AddressMapModal
        open={showMapModal}
        address={`${form.city}${form.district}${form.street}`}
        initialLat={form.gps_lat}
        initialLng={form.gps_lng}
        onClose={() => { setShowMapModal(false); setPendingSave(false); }}
        onConfirm={handleMapConfirm}
      />

      <RegionPicker
        open={showRegionPicker}
        city={form.city}
        district={form.district}
        onClose={() => setShowRegionPicker(false)}
        onConfirm={({ city, district, postal_code }) => {
          setForm(f => ({ ...f, city, district, postal_code }));
          setShowRegionPicker(false);
        }}
      />

      {/* EditSheet */}
      <EditSheet
        open={!!editField}
        title={editField?.title || ''}
        value={editField?.value || ''}
        inputType={editField?.inputType || 'text'}
        placeholder={editField?.placeholder || ''}
        options={editField?.options || []}
        onClose={() => setEditField(null)}
        onSave={(v) => handleEditSave(editField?.key, v)}
      />
    </div>
  );
}