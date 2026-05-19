import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

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

/* ── 服務類別（後台排序演算法後顯示，這裡先固定順序，可後續改為 prop） ── */
const CATEGORIES = [
  { id: 'light',     label: '輕量清潔',  route: '/SearchResults?service=輕量清潔',   icon: icons.light },
  { id: 'recurring', label: '定期清潔',  route: '/SearchResults?service=定期清潔',   icon: icons.recurring },
  { id: 'deep',      label: '大掃除',    route: '/SearchResults?service=大掃除',     icon: icons.deep },
  { id: 'moveout',   label: '退租前細清', route: '/SearchResults?service=退租前細清', icon: icons.moveout },
  { id: 'movein',    label: '入住前細清', route: '/SearchResults?service=入住前細清', icon: icons.movein },
  { id: 'airbnb',    label: '民宿房務',  route: '/SearchResults?service=民宿房務',   icon: icons.airbnb },
  { id: 'reno',      label: '裝潢後細清', route: '/SearchResults?service=裝潢後細清', icon: icons.reno },
];

/* ── 下行篩選標籤 ── */
const FILTERS = [
  { label: '✦ Heson Premium', route: '/ServiceInquiry?plan=premium' },
  { label: '優惠方案',         route: '/ClientBooking?filter=deal' },
  { label: '⭐ 評分最高',      route: '/CleanerTeam?sort=rating' },
  { label: '🔥 熱門首選',      route: '/CleanerTeam?sort=popular' },
  { label: '⚡ 快速到府',      route: '/FlashTaskPost' },
];

export default function CategoryChips() {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-stone-100">
      {/* 上行：圖示 + 文字，每格等寬，一次顯示 5 個，右側截斷 */}
      <div className="flex overflow-x-auto scrollbar-none px-3 pt-4 pb-2 gap-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(cat.route)}
            className="flex flex-col items-center flex-shrink-0 active:scale-95 transition-transform"
            style={{ width: '20vw', maxWidth: 80, minWidth: 60 }}
          >
            {/* icon 圓形容器 */}
            <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden mb-1.5">
              {cat.icon}
            </div>
            <span className="text-[11px] font-medium text-stone-700 leading-tight text-center whitespace-nowrap px-0.5">
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* 下行：篩選膠囊 */}
      <div className="flex overflow-x-auto gap-2 px-4 pb-3 pt-1 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => navigate(f.route)}
            className="flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors flex-shrink-0"
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}