import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, Shield, MapPin, X, Sparkles, Tag, TrendingUp, Flame, Zap, User } from 'lucide-react';

/* ── 彩色 SVG icon 定義 ── */
const icons = {
  light: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="32" cy="32" r="28" fill="#FFF3E0"/>
      <path d="M20 44 Q32 20 44 44" stroke="#FF8C00" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <circle cx="32" cy="18" r="5" fill="#FFB300"/>
      <path d="M24 36 Q32 26 40 36" stroke="#FFB300" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  recurring: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="32" cy="32" r="28" fill="#E8F5E9"/>
      <path d="M20 32 A12 12 0 0 1 44 32" stroke="#43A047" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M40 24 L44 32 L36 32" stroke="#43A047" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M44 32 A12 12 0 0 1 20 32" stroke="#81C784" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M24 40 L20 32 L28 32" stroke="#81C784" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  deep: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="32" cy="32" r="28" fill="#E3F2FD"/>
      <rect x="22" y="30" width="20" height="14" rx="3" fill="#1E88E5"/>
      <rect x="19" y="27" width="26" height="6" rx="2" fill="#42A5F5"/>
      <path d="M28 30 L28 24 Q32 19 36 24 L36 30" stroke="#1565C0" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="32" cy="22" r="3" fill="#64B5F6"/>
    </svg>
  ),
  moveout: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="32" cy="32" r="28" fill="#FCE4EC"/>
      <rect x="18" y="20" width="28" height="22" rx="3" fill="#E91E63" opacity="0.15"/>
      <rect x="18" y="20" width="28" height="22" rx="3" stroke="#E91E63" strokeWidth="2.5" fill="none"/>
      <path d="M24 32 L30 38 L40 26" stroke="#E91E63" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26 44 L38 44" stroke="#F48FB1" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  movein: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="32" cy="32" r="28" fill="#EDE7F6"/>
      <path d="M20 42 L32 22 L44 42 Z" fill="#7E57C2" opacity="0.2"/>
      <path d="M20 42 L32 22 L44 42" stroke="#7E57C2" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
      <rect x="27" y="32" width="10" height="10" rx="1.5" fill="#7E57C2"/>
      <rect x="24" y="28" width="16" height="4" rx="1" fill="#9575CD"/>
    </svg>
  ),
  airbnb: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="32" cy="32" r="28" fill="#FFF8E1"/>
      <path d="M22 42 L22 28 L32 20 L42 28 L42 42" stroke="#F9A825" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
      <rect x="27" y="33" width="10" height="9" rx="1.5" fill="#F9A825"/>
      <rect x="28" y="26" width="8" height="6" rx="1" fill="#FFD54F"/>
      <path d="M18 30 L32 19 L46 30" stroke="#FFC107" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  reno: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="32" cy="32" r="28" fill="#E0F7FA"/>
      <rect x="20" y="38" width="24" height="6" rx="2" fill="#00ACC1"/>
      <rect x="24" y="26" width="4" height="14" rx="1.5" fill="#26C6DA"/>
      <rect x="30" y="22" width="4" height="18" rx="1.5" fill="#00ACC1"/>
      <rect x="36" y="30" width="4" height="10" rx="1.5" fill="#26C6DA"/>
      <path d="M18 38 Q32 14 46 38" stroke="#00BCD4" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
};

/* ── 服務類別（上排，單選） ── */
const CATEGORIES = [
  { id: 'light',     label: '輕量清潔',  icon: icons.light },
  { id: 'recurring', label: '定期清潔',  icon: icons.recurring },
  { id: 'deep',      label: '細清／大掃除', icon: icons.deep },
  { id: 'moveout',   label: '退租前細清', icon: icons.moveout },
  { id: 'movein',    label: '入住前細清', icon: icons.movein },
  { id: 'airbnb',    label: '民宿房務',  icon: icons.airbnb },
  { id: 'reno',      label: '裝潢後細清', icon: icons.reno },
];

/* ── 篩選標籤（下排，複選） ── */
const FILTERS = [
  { id: 'premium',  label: 'Heson Premium', Icon: Sparkles },
  { id: 'deal',     label: '優惠方案',       Icon: Tag },
  { id: 'top',      label: '評分最高',       Icon: Star },
  { id: 'popular',  label: '熱門首選',       Icon: Flame },
  { id: 'flash',    label: '快速到府',       Icon: Zap },
];

/* ── 管理師卡片 ── */
function CleanerCard({ cleaner, avgRating, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 flex gap-3 text-left shadow-sm border border-stone-100 active:scale-[0.99] transition-transform"
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 flex items-center justify-center">
        {cleaner.profile_photo
          ? <img src={cleaner.profile_photo} alt={cleaner.nickname} className="w-full h-full object-cover" />
          : <User className="w-7 h-7 text-stone-300" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-bold text-stone-900 text-sm">{cleaner.nickname || '管理師'}</p>
          {cleaner.police_record_verified && <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
          {cleaner.is_active && (
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">接案中</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
          {avgRating && (
            <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{avgRating}
            </span>
          )}
          <span>{cleaner.experience_years || 1} 年資</span>
          {cleaner.residence_area && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />{cleaner.residence_area}
            </span>
          )}
        </div>
        {cleaner.service_areas?.length > 0 && (
          <p className="text-[11px] text-stone-400 truncate">服務地區：{cleaner.service_areas.slice(0, 3).join('・')}</p>
        )}
      </div>
      <div className="flex items-center text-stone-300 text-lg">›</div>
    </button>
  );
}

export default function CategoryChips() {
  const navigate = useNavigate();
  const [selectedCat, setSelectedCat] = useState(null); // 單選
  const [selectedFilters, setSelectedFilters] = useState([]); // 複選

  const isOpen = selectedCat !== null || selectedFilters.length > 0;

  /* ── 資料：僅在有選取時才 fetch ── */
  const { data: cleaners = [], isLoading } = useQuery({
    queryKey: ['categoryCleaners'],
    queryFn: () => base44.entities.CleanerProfile.filter({ is_active: true }, '-created_date', 100),
    enabled: isOpen,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['categoryReviews'],
    queryFn: () => base44.entities.ServiceReview.list('-created_date', 200),
    enabled: isOpen && cleaners.length > 0,
  });

  /* ── 篩選邏輯 ── */
  const results = useMemo(() => {
    if (!isOpen) return [];

    let list = cleaners;

    // 上排單選：篩選服務類型
    if (selectedCat) {
      const cat = CATEGORIES.find(c => c.id === selectedCat);
      list = list.filter(c =>
        !c.service_types?.length ||
        c.service_types.some(s => s.includes(cat.label) || cat.label.includes(s))
      );
    }

    // 下排複選：疊加篩選
    if (selectedFilters.includes('premium')) {
      // Heson Premium：保留全部（標誌性服務，不特別過濾）
    }
    if (selectedFilters.includes('deal')) {
      // 優惠方案：有 expected_hourly_rate 且較低（示意）
      list = list.filter(c => c.expected_hourly_rate && c.expected_hourly_rate <= 300);
    }
    if (selectedFilters.includes('top')) {
      // 評分最高：有評論且評分 >= 4.5
      list = list.filter(c => {
        const rs = reviews.filter(r => r.cleaner_id === c.user_id);
        if (!rs.length) return false;
        const avg = rs.reduce((s, r) => s + (r.rating || 0), 0) / rs.length;
        return avg >= 4.5;
      });
    }
    if (selectedFilters.includes('popular')) {
      // 熱門首選：有 5 則以上評論
      list = list.filter(c => reviews.filter(r => r.cleaner_id === c.user_id).length >= 5);
    }
    if (selectedFilters.includes('flash')) {
      // 快速到府：is_active
      list = list.filter(c => c.is_active);
    }

    // 去重（以 user_id 為準）
    const seen = new Set();
    return list.filter(c => {
      if (seen.has(c.user_id)) return false;
      seen.add(c.user_id);
      return true;
    });
  }, [cleaners, reviews, selectedCat, selectedFilters, isOpen]);

  const getAvgRating = (cleanerId) => {
    const rs = reviews.filter(r => r.cleaner_id === cleanerId);
    if (!rs.length) return null;
    return (rs.reduce((s, r) => s + (r.rating || 0), 0) / rs.length).toFixed(1);
  };

  const toggleFilter = (id) => {
    setSelectedFilters(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  /* ── 組合選取標籤文字 ── */
  const selectedLabels = [
    selectedCat ? CATEGORIES.find(c => c.id === selectedCat)?.label : null,
    ...selectedFilters.map(f => FILTERS.find(x => x.id === f)?.label),
  ].filter(Boolean);

  return (
    <div className="bg-white border-b border-stone-100">
      {/* 上行：類別（單選） */}
      <div className="flex overflow-x-auto scrollbar-none px-3 pt-4 pb-2 gap-0">
        {CATEGORIES.map((cat) => {
          const active = selectedCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(prev => prev === cat.id ? null : cat.id)}
              className="flex flex-col items-center flex-shrink-0 active:scale-95 transition-transform"
              style={{ width: '20vw', maxWidth: 80, minWidth: 60 }}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden mb-1.5 transition-all ${active ? 'ring-2 ring-stone-800 ring-offset-2' : ''}`}>
                {cat.icon}
              </div>
              <span className={`text-[11px] font-medium leading-tight text-center whitespace-nowrap px-0.5 ${active ? 'text-stone-900 font-bold' : 'text-stone-600'}`}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 下行：篩選膠囊（複選） */}
      <div className="flex overflow-x-auto gap-2 px-4 pb-3 pt-1 scrollbar-none">
        {FILTERS.map((f) => {
          const active = selectedFilters.includes(f.id);
          const FIcon = f.Icon;
          return (
            <button
              key={f.id}
              onClick={() => toggleFilter(f.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                active
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <FIcon className="w-3 h-3" />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* 展開結果區塊 */}
      {isOpen && (
        <div className="border-t border-stone-100 bg-stone-50">
          {/* 標題列 */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedLabels.map(l => (
                <span key={l} className="text-xs font-semibold text-stone-700 bg-white border border-stone-200 px-2 py-0.5 rounded-full">{l}</span>
              ))}
              {!isLoading && (
                <span className="text-xs text-stone-400">{results.length} 個結果</span>
              )}
            </div>
            <button
              onClick={() => { setSelectedCat(null); setSelectedFilters([]); }}
              className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0"
            >
              <X className="w-3.5 h-3.5 text-stone-600" />
            </button>
          </div>

          {/* 結果列表 */}
          <div className="px-4 pb-4 space-y-2">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
              ))
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">目前沒有符合條件的管理師</p>
                <button
                  onClick={() => navigate('/ServiceInquiry')}
                  className="mt-3 px-5 py-1.5 bg-stone-900 text-white text-xs rounded-full"
                >
                  填寫需求詢問
                </button>
              </div>
            ) : (
              results.map(cleaner => (
                <CleanerCard
                  key={cleaner.id}
                  cleaner={cleaner}
                  avgRating={getAvgRating(cleaner.user_id)}
                  onClick={() => navigate(`/ServiceInquiry?cleaner=${cleaner.user_id}`)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}