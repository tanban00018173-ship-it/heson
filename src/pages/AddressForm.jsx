import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";

// 台灣城市 & 區域郵遞區號對照
const TW_DISTRICTS = {
  "台北市": {
    "中正區": "100", "大同區": "103", "中山區": "104", "松山區": "105",
    "大安區": "106", "萬華區": "108", "信義區": "110", "士林區": "111",
    "北投區": "112", "內湖區": "114", "南港區": "115", "文山區": "116",
  },
  "新北市": {
    "板橋區": "220", "三重區": "241", "中和區": "235", "永和區": "234",
    "新莊區": "242", "新店區": "231", "樹林區": "238", "鶯歌區": "239",
    "三峽區": "237", "淡水區": "251", "汐止區": "221", "瑞芳區": "224",
    "土城區": "236", "蘆洲區": "247", "深坑區": "222", "石碇區": "223",
  },
  "桃園市": {
    "桃園區": "330", "中壢區": "320", "大溪區": "335", "楊梅區": "326",
    "蘆竹區": "338", "大園區": "337", "龜山區": "333", "八德區": "334",
    "龍潭區": "325", "平鎮區": "324", "新屋區": "327", "觀音區": "328",
  },
  "台中市": {
    "中區": "400", "東區": "401", "南區": "402", "西區": "403",
    "北區": "404", "北屯區": "406", "西屯區": "407", "南屯區": "408",
    "太平區": "411", "大里區": "412", "霧峰區": "413", "烏日區": "414",
    "豐原區": "420", "后里區": "421", "石岡區": "422", "東勢區": "423",
  },
  "台南市": {
    "中西區": "700", "東區": "701", "南區": "702", "北區": "704",
    "安平區": "708", "安南區": "709", "永康區": "710", "歸仁區": "711",
    "新化區": "712", "左鎮區": "713", "玉井區": "714", "楠西區": "715",
  },
  "高雄市": {
    "楠梓區": "811", "左營區": "813", "鼓山區": "804", "三民區": "807",
    "鹽埕區": "803", "前金區": "801", "新興區": "800", "苓雅區": "802",
    "前鎮區": "806", "旗津區": "805", "小港區": "812", "鳳山區": "830",
    "林園區": "832", "大寮區": "831", "大樹區": "840", "大社區": "815",
  },
  "基隆市": {
    "仁愛區": "200", "信義區": "201", "中正區": "202", "中山區": "203",
    "安樂區": "204", "暖暖區": "205", "七堵區": "206",
  },
  "新竹市": {
    "東區": "300", "北區": "302", "香山區": "304",
  },
  "新竹縣": {
    "竹北市": "302", "湖口鄉": "303", "新豐鄉": "304", "新埔鎮": "305",
    "關西鎮": "306", "芎林鄉": "307", "寶山鄉": "308", "竹東鎮": "310",
  },
  "苗栗縣": {
    "苗栗市": "360", "造橋鄉": "361", "頭屋鄉": "362", "公館鄉": "363",
    "大湖鄉": "364", "泰安鄉": "365", "銅鑼鄉": "366", "三義鄉": "367",
  },
  "南投縣": {
    "南投市": "540", "中寮鄉": "541", "草屯鎮": "542", "國姓鄉": "544",
    "埔里鎮": "545", "仁愛鄉": "546", "名間鄉": "551", "集集鎮": "552",
  },
  "彰化縣": {
    "彰化市": "500", "芬園鄉": "502", "花壇鄉": "503", "秀水鄉": "504",
    "鹿港鎮": "505", "福興鄉": "506", "線西鄉": "507", "和美鎮": "508",
  },
  "嘉義市": {
    "東區": "600", "西區": "600",
  },
  "嘉義縣": {
    "番路鄉": "602", "梅山鄉": "603", "竹崎鄉": "604", "阿里山鄉": "605",
    "中埔鄉": "606", "大埔鄉": "607", "水上鄉": "608", "鹿草鄉": "611",
  },
  "屏東縣": {
    "屏東市": "900", "三地門鄉": "901", "霧台鄉": "902", "瑪家鄉": "903",
    "九如鄉": "904", "里港鄉": "905", "高樹鄉": "906", "鹽埔鄉": "907",
  },
  "宜蘭縣": {
    "宜蘭市": "260", "頭城鎮": "261", "礁溪鄉": "262", "壯圍鄉": "263",
    "員山鄉": "264", "羅東鎮": "265", "三星鄉": "266", "大同鄉": "267",
  },
  "花蓮縣": {
    "花蓮市": "970", "新城鄉": "971", "吉安鄉": "973", "壽豐鄉": "974",
    "鳳林鎮": "975", "光復鄉": "976", "豐濱鄉": "977", "瑞穗鄉": "978",
  },
  "台東縣": {
    "台東市": "950", "綠島鄉": "951", "蘭嶼鄉": "952", "延平鄉": "953",
    "卑南鄉": "954", "鹿野鄉": "955", "關山鎮": "956", "海端鄉": "957",
  },
  "澎湖縣": {
    "馬公市": "880", "西嶼鄉": "881", "望安鄉": "882", "七美鄉": "883",
    "白沙鄉": "884", "湖西鄉": "885",
  },
};

// 清潔地址類型 vs 超商取貨地址（兩個互相獨立）
const DEFAULT_GROUP = {
  "居家地址": "cleaning",
  "公司地址": "cleaning",
  "其他地址": "cleaning",
  "超商取貨地址": "convenience",
};

export default function AddressForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 解析 URL params
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');
  const defaultType = params.get('type') || '居家地址';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      if (!auth) { base44.auth.redirectToLogin(); return; }
      base44.auth.me().then(setUser);
    });
  }, []);

  // 讀取既有地址（編輯模式）
  useEffect(() => {
    if (editId && user) {
      base44.entities.UserAddress.filter({ user_id: user.id }).then(list => {
        const found = list.find(a => a.id === editId);
        if (found) setForm({ ...found });
      });
    }
  }, [editId, user]);

  // 自動帶入郵遞區號
  useEffect(() => {
    const postal = TW_DISTRICTS[form.city]?.[form.district] || '';
    setForm(f => ({ ...f, postal_code: postal }));
  }, [form.city, form.district]);

  // 切換城市時，自動選第一個區
  const handleCityChange = (city) => {
    const firstDistrict = Object.keys(TW_DISTRICTS[city] || {})[0] || '';
    setForm(f => ({ ...f, city, district: firstDistrict }));
  };

  const districts = Object.keys(TW_DISTRICTS[form.city] || {});

  const handleSave = async () => {
    if (!form.full_name || !form.phone || !form.street) return;
    setLoading(true);
    const payload = { ...form, user_id: user.id };

    // 若設為預設，關閉同組其他地址的 is_default
    if (form.is_default) {
      const myGroup = DEFAULT_GROUP[form.address_type];
      const sameGroupTypes = Object.entries(DEFAULT_GROUP)
        .filter(([, g]) => g === myGroup)
        .map(([t]) => t);
      const allAddresses = await base44.entities.UserAddress.filter({ user_id: user.id });
      const toUnset = allAddresses.filter(a =>
        sameGroupTypes.includes(a.address_type) && a.is_default && a.id !== editId
      );
      await Promise.all(toUnset.map(a => base44.entities.UserAddress.update(a.id, { is_default: false })));
    }

    if (editId) {
      await base44.entities.UserAddress.update(editId, payload);
    } else {
      await base44.entities.UserAddress.create(payload);
    }

    queryClient.invalidateQueries({ queryKey: ['userAddresses', user?.id] });
    setLoading(false);
    navigate(-1);
  };

  const handleDelete = async () => {
    if (!editId) return;
    setLoading(true);
    await base44.entities.UserAddress.delete(editId);
    queryClient.invalidateQueries({ queryKey: ['userAddresses', user?.id] });
    setLoading(false);
    navigate(-1);
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col">
      {/* 頂部導航 */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-stone-900">地址</h1>
        {editId ? (
          <button onClick={handleDelete} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-36">
        {/* 地址類型 */}
        <p className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">地址類型</p>
        <div className="bg-white">
          <div className="px-4 py-3.5 border-b border-stone-100">
            <div className="grid grid-cols-2 gap-2">
              {['居家地址', '公司地址', '其他地址', '超商取貨地址'].map(t => (
                <button
                  key={t}
                  onClick={() => set('address_type', t)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.address_type === t ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 收件人資訊 */}
        <p className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">收件人資訊</p>
        <div className="bg-white">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-100">
            <span className="text-sm text-stone-500 w-20 flex-shrink-0">全名</span>
            <input
              type="text"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              placeholder="請輸入收件人姓名"
              className="flex-1 text-sm text-stone-800 text-right focus:outline-none placeholder:text-stone-300"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-stone-500 w-20 flex-shrink-0">手機號碼</span>
            <input
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="請輸入手機號碼"
              className="flex-1 text-sm text-stone-800 text-right focus:outline-none placeholder:text-stone-300"
            />
          </div>
        </div>

        {/* 地址資訊 */}
        <p className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">地址資訊</p>
        <div className="bg-white">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-100">
            <span className="text-sm text-stone-500 w-20 flex-shrink-0">城市</span>
            <select
              value={form.city}
              onChange={e => handleCityChange(e.target.value)}
              className="flex-1 text-sm text-stone-800 text-right focus:outline-none bg-transparent appearance-none"
            >
              {Object.keys(TW_DISTRICTS).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-100">
            <span className="text-sm text-stone-500 w-20 flex-shrink-0">區</span>
            <select
              value={form.district}
              onChange={e => set('district', e.target.value)}
              className="flex-1 text-sm text-stone-800 text-right focus:outline-none bg-transparent appearance-none"
            >
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-100">
            <span className="text-sm text-stone-500 w-20 flex-shrink-0">郵遞區號</span>
            <span className="text-sm text-stone-400">{form.postal_code || '—'}</span>
          </div>
          <div className="flex items-start justify-between px-4 py-3.5">
            <span className="text-sm text-stone-500 w-20 flex-shrink-0 pt-0.5">街道</span>
            <textarea
              value={form.street}
              onChange={e => set('street', e.target.value)}
              placeholder="街道、巷弄、門號、樓層"
              rows={2}
              className="flex-1 text-sm text-stone-800 text-right focus:outline-none placeholder:text-stone-300 resize-none bg-transparent"
            />
          </div>
        </div>

        {/* 預設地址 */}
        <p className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">其他設定</p>
        <div className="bg-white">
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-stone-800">設定為預設地址</p>
              <p className="text-xs text-stone-400 mt-0.5">開啟後，同類型其他地址將自動取消預設</p>
            </div>
            <button
              onClick={() => set('is_default', !form.is_default)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${form.is_default ? 'bg-stone-900' : 'bg-stone-200'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.is_default ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* 儲存按鈕 */}
        <div className="px-4 pt-6 pb-4">
          <button
            onClick={handleSave}
            disabled={loading || !form.full_name || !form.phone || !form.street}
            className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl hover:bg-stone-700 transition-colors disabled:opacity-40"
          >
            {loading ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>

      <ClientBottomNav />
    </div>
  );
}