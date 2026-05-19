import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconLight, IconRecurring, IconDeepClean, IconMoveOut, IconMoveIn, IconAirbnb, IconReno
} from './CleaningIcons';
import { Crown, Star, Tag } from 'lucide-react';

/* ─── 服務分類定義 ─── */
const SERVICES = [
  { id: 'light',    Icon: IconLight,     label: '輕量清潔',   weight: 80, route: '/ServiceInquiry?service=輕量清潔' },
  { id: 'recurring',Icon: IconRecurring, label: '定期清潔',   weight: 70, route: '/ClientBooking' },
  { id: 'deep',     Icon: IconDeepClean, label: '大掃除',     weight: 60, route: '/ServiceInquiry?service=大掃除' },
  { id: 'moveout',  Icon: IconMoveOut,   label: '退租前細清', weight: 50, route: '/ServiceInquiry?service=退租前細清' },
  { id: 'movein',   Icon: IconMoveIn,    label: '入住前細清', weight: 50, route: '/ServiceInquiry?service=入住前細清' },
  { id: 'airbnb',   Icon: IconAirbnb,    label: '民宿房務',   weight: 40, route: '/ServiceInquiry?service=民宿房務' },
  { id: 'reno',     Icon: IconReno,      label: '裝潢後細清', weight: 30, route: '/ServiceInquiry?service=裝潢後細清' },
];

/* 後台演算法：依 weight + 輕微 jitter 排序，模擬個人化推薦 */
function sortByAlgo(services) {
  return [...services]
    .map(s => ({ ...s, _score: s.weight + Math.random() * 20 }))
    .sort((a, b) => b._score - a._score);
}

/* ─── 下行篩選標籤 ─── */
const FILTERS = [
  { id: 'premium', Icon: Crown,  label: 'Heson Premium', route: '/ClientBooking' },
  { id: 'deal',    Icon: Tag,    label: '優惠方案',       route: '/ClientShop' },
  { id: 'top',     Icon: Star,   label: '評分最高',       route: '/CleanerTeam' },
];

export default function CategoryChips() {
  const navigate = useNavigate();
  // memo：每次頁面載入重排一次（模擬演算法推薦）
  const sorted = useMemo(() => sortByAlgo(SERVICES), []);

  return (
    <div className="bg-white border-b border-stone-100">
      {/* 上行：服務圖示 */}
      <div className="flex overflow-x-auto gap-1 px-3 pt-4 pb-2 scrollbar-none">
        {sorted.map(({ id, Icon, label, route }) => (
          <button
            key={id}
            onClick={() => navigate(route)}
            className="flex flex-col items-center gap-2 flex-shrink-0 px-3 active:scale-95 transition-transform"
            style={{ minWidth: '64px' }}
          >
            <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center">
              <Icon className="w-9 h-9" />
            </div>
            <span className="text-[12px] font-medium text-stone-700 text-center leading-tight whitespace-nowrap">
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* 下行：篩選標籤 */}
      <div className="flex overflow-x-auto gap-2 px-3 pb-3 scrollbar-none">
        {FILTERS.map(({ id, Icon, label, route }) => (
          <button
            key={id}
            onClick={() => navigate(route)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 transition-colors flex-shrink-0"
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}