import React from 'react';

/**
 * 共用排序篩選器 — pill 橫向滾動樣式
 * options: [{ value, label }]
 */
export default function SortFilterBar({ options, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full font-medium transition-all ${
            value === opt.value
              ? 'bg-stone-900 text-white'
              : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}