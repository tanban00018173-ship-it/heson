import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown } from "lucide-react";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";

// 台灣城市區域與郵遞區號
const TW_DATA = {
  '台北市': { '中正區': '100', '大同區': '103', '中山區': '104', '松山區': '105', '大安區': '106', '萬華區': '108', '信義區': '110', '士林區': '111', '北投區': '112', '內湖區': '114', '南港區': '115', '文山區': '116' },
  '新北市': { '板橋區': '220', '三重區': '241', '中和區': '235', '永和區': '234', '新莊區': '242', '新店區': '231', '樹林區': '238', '鶯歌區': '239', '三峽區': '237', '淡水區': '251', '汐止區': '221', '瑞芳區': '224', '土城區': '236', '蘆洲區': '247', '五股區': '248', '泰山區': '243', '林口區': '244', '深坑區': '222', '石碇區': '223', '坪林區': '232', '三芝區': '252', '石門區': '253', '八里區': '249', '平溪區': '226', '雙溪區': '227', '貢寮區': '228', '金山區': '208', '萬里區': '207', '烏來區': '233' },
  '桃園市': { '桃園區': '330', '中壢區': '320', '大溪區': '335', '楊梅區': '326', '蘆竹區': '338', '大園區': '337', '龜山區': '333', '八德區': '334', '龍潭區': '325', '平鎮區': '324', '新屋區': '327', '觀音區': '328', '復興區': '336' },
  '台中市': { '中區': '400', '東區': '401', '南區': '402', '西區': '403', '北區': '404', '北屯區': '406', '西屯區': '407', '南屯區': '408', '太平區': '411', '大里區': '412', '霧峰區': '413', '烏日區': '414', '豐原區': '420', '后里區': '421', '石岡區': '422', '東勢區': '423', '和平區': '424', '新社區': '426', '潭子區': '427', '大雅區': '428', '神岡區': '429', '大肚區': '432', '沙鹿區': '433', '龍井區': '434', '梧棲區': '435', '清水區': '436', '大甲區': '437', '外埔區': '438', '大安區': '439' },
  '台南市': { '中西區': '700', '東區': '701', '南區': '702', '北區': '704', '安平區': '708', '安南區': '709', '永康區': '710', '歸仁區': '711', '新化區': '712', '左鎮區': '713', '玉井區': '714', '楠西區': '715', '南化區': '716', '仁德區': '717', '關廟區': '718', '龍崎區': '719', '官田區': '720', '麻豆區': '721', '佳里區': '722', '西港區': '723', '七股區': '724', '將軍區': '725', '學甲區': '726', '北門區': '727', '新營區': '730', '後壁區': '731', '白河區': '732', '東山區': '733', '六甲區': '734', '下營區': '735', '柳營區': '736', '鹽水區': '737', '善化區': '741', '大內區': '742', '山上區': '743', '新市區': '744', '安定區': '745' },
  '高雄市': { '新興區': '800', '前金區': '801', '苓雅區': '802', '鹽埕區': '803', '鼓山區': '804', '旗津區': '805', '前鎮區': '806', '三民區': '807', '楠梓區': '811', '小港區': '812', '左營區': '813', '仁武區': '814', '大社區': '815', '岡山區': '820', '路竹區': '821', '阿蓮區': '822', '田寮區': '823', '燕巢區': '824', '橋頭區': '825', '梓官區': '826', '彌陀區': '827', '永安區': '828', '湖內區': '829', '鳳山區': '830', '大寮區': '831', '林園區': '832', '鳥松區': '833', '大樹區': '840', '旗山區': '842', '美濃區': '843', '六龜區': '844', '內門區': '845', '杉林區': '846', '甲仙區': '847', '桃源區': '848', '那瑪夏區': '849', '茂林區': '851', '茄萣區': '852' },
};

const CLEANING_TYPES = ['居家地址', '公司地址', '其他地址'];
const PICKUP_TYPES = ['超商取貨地址'];

const TYPE_OPTIONS = {
  cleaning: ['居家地址', '公司地址', '其他地址'],
  pickup: ['超商取貨地址'],
};

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
    city: '台北市',
    district: '中正區',
    postal_code: '100',
    street: '',
    is_default: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      if (!auth) { base44.auth.redirectToLogin(); return; }
      base44.auth.me().then(setUser);
    });
  }, []);

  // 載入既有地址
  const { data: existingAddress } = useQuery({
    queryKey: ['userAddress', addressId],
    queryFn: () => base44.entities.UserAddress.filter({ id: addressId }),
    enabled: !!addressId,
  });

  useEffect(() => {
    if (existingAddress?.[0]) {
      setForm({ ...existingAddress[0] });
    }
  }, [existingAddress]);

  // 城市改變時自動填郵遞區號
  const handleCityChange = (city) => {
    const districts = TW_DATA[city] || {};
    const firstDistrict = Object.keys(districts)[0] || '';
    const postalCode = districts[firstDistrict] || '';
    setForm(f => ({ ...f, city, district: firstDistrict, postal_code: postalCode }));
  };

  const handleDistrictChange = (district) => {
    const postalCode = TW_DATA[form.city]?.[district] || '';
    setForm(f => ({ ...f, district, postal_code: postalCode }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const data = { ...form, user_id: user.id };

    // 若設為預設，關閉同類型其他預設
    if (form.is_default) {
      const allAddresses = await base44.entities.UserAddress.filter({ user_id: user.id });
      const isCleaning = CLEANING_TYPES.includes(form.address_type);
      const sameTypeAddresses = allAddresses.filter(a => {
        const aIsCleaning = CLEANING_TYPES.includes(a.address_type);
        return aIsCleaning === isCleaning && a.id !== addressId && a.is_default;
      });
      await Promise.all(sameTypeAddresses.map(a =>
        base44.entities.UserAddress.update(a.id, { is_default: false })
      ));
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

  const handleDelete = async () => {
    if (!addressId) return;
    await base44.entities.UserAddress.delete(addressId);
    queryClient.invalidateQueries({ queryKey: ['userAddresses', user?.id] });
    navigate('/ClientAddressList');
  };

  const cities = Object.keys(TW_DATA);
  const districts = Object.keys(TW_DATA[form.city] || {});
  const typeOptions = CLEANING_TYPES.includes(form.address_type)
    ? CLEANING_TYPES
    : PICKUP_TYPES;

  const InputField = ({ label, children }) => (
    <div className="flex items-center px-4 py-3.5 border-b border-stone-100 last:border-0">
      <span className="text-sm text-stone-500 w-28 flex-shrink-0">{label}</span>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col">
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
        >
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
        <div className="bg-white">
          {typeOptions.map(type => (
            <button
              key={type}
              onClick={() => setForm(f => ({ ...f, address_type: type }))}
              className="w-full flex items-center justify-between px-4 py-3.5 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors"
            >
              <span className="text-sm font-medium text-stone-800">{type}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.address_type === type ? 'border-stone-900 bg-stone-900' : 'border-stone-300'}`}>
                {form.address_type === type && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>

        {/* 收件人資訊 */}
        <p className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">收件人資訊</p>
        <div className="bg-white">
          <InputField label="全名">
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="請輸入全名"
              className="flex-1 text-sm text-stone-800 focus:outline-none placeholder-stone-300"
            />
          </InputField>
          <InputField label="手機號碼">
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="請輸入手機號碼"
              className="flex-1 text-sm text-stone-800 focus:outline-none placeholder-stone-300"
            />
          </InputField>
        </div>

        {/* 地址資訊 */}
        <p className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">地址資訊</p>
        <div className="bg-white">
          <InputField label="城市">
            <div className="flex-1 relative">
              <select
                value={form.city}
                onChange={e => handleCityChange(e.target.value)}
                className="w-full text-sm text-stone-800 focus:outline-none appearance-none bg-transparent pr-6"
              >
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </InputField>
          <InputField label="區">
            <div className="flex-1 relative">
              <select
                value={form.district}
                onChange={e => handleDistrictChange(e.target.value)}
                className="w-full text-sm text-stone-800 focus:outline-none appearance-none bg-transparent pr-6"
              >
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </InputField>
          <InputField label="郵遞區號">
            <span className="flex-1 text-sm text-stone-400">{form.postal_code}</span>
          </InputField>
          <InputField label="街道,巷弄,門號">
            <input
              type="text"
              value={form.street}
              onChange={e => setForm(f => ({ ...f, street: e.target.value }))}
              placeholder="街道、巷弄、門號、樓層"
              className="flex-1 text-sm text-stone-800 focus:outline-none placeholder-stone-300"
            />
          </InputField>
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
    </div>
  );
}