import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'all',       emoji: '🏠', label: '全部',     route: null },
  { id: 'home',      emoji: '🧹', label: '居家清潔', route: '/ServiceInquiry?service=居家清潔' },
  { id: 'appliance', emoji: '❄️', label: '家電清洗', route: '/ServiceInquiry?service=家電清洗' },
  { id: 'fabric',    emoji: '🛋️', label: '布面清洗', route: '/ServiceInquiry?service=布面清洗' },
  { id: 'organize',  emoji: '📦', label: '整理收納', route: '/ServiceInquiry?service=整理收納' },
  { id: 'biz',       emoji: '🏢', label: '商業清潔', route: '/ServiceInquiry?service=商業清潔' },
  { id: 'reno',      emoji: '🔨', label: '裝潢清潔', route: '/ServiceInquiry?service=裝潢後清潔' },
  { id: 'flash',     emoji: '⚡', label: '閃電任務', route: '/FlashTaskPost' },
];

export default function CategoryChips() {
  const [active, setActive] = useState('all');
  const navigate = useNavigate();

  const handleClick = (cat) => {
    setActive(cat.id);
    if (cat.route) navigate(cat.route);
  };

  return (
    <div className="bg-white border-b border-stone-100">
      {/* Scrollable chip row */}
      <div className="flex overflow-x-auto gap-2 px-4 py-3 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleClick(cat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
              active === cat.id
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Quick filter pills row */}
      <div className="flex overflow-x-auto gap-2 px-4 pb-3 scrollbar-none">
        {['🎁 首次優惠', '⭐ 高評分', '🚀 10分鐘到', '💎 訂閱方案'].map((label) => (
          <button
            key={label}
            onClick={() => navigate('/ClientBooking')}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 transition-colors flex-shrink-0"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}