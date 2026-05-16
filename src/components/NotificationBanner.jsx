import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';

export default function NotificationBanner({ onAllow }) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 bg-[#FFF9E6] border border-[#FFE58F] px-4 py-3 mb-3 -mx-4">
      {/* 鈴鐺 icon */}
      <div className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
        <Bell className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
      </div>

      {/* 文字 */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-stone-700 leading-snug">
          允許收到通知以獲得訂單更新進度及優惠
        </p>
        <button
          onClick={onAllow}
          className="text-xs text-gold-600 font-semibold mt-0.5 hover:text-gold-700 transition-colors"
        >
          允許
        </button>
      </div>

      {/* 關閉 */}
      <button
        onClick={() => setVisible(false)}
        className="text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0 p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}