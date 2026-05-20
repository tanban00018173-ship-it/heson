import React from 'react';
import { Home, ClipboardList, Layers, Star, User } from 'lucide-react';

const TABS = [
  { id: 'home',     label: '首頁',    Icon: Home },
  { id: 'orders',   label: '訂單',    Icon: ClipboardList },
  { id: 'services', label: '服務',    Icon: Layers },
  { id: 'reviews',  label: '評價',    Icon: Star },
  { id: 'profile',  label: '我的',    Icon: User },
];

export default function DashboardNav({ tab, onChange, bookings }) {
  const pendingCount = bookings.filter(b => b.status === '待確認').length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-100 flex">
      {TABS.map(({ id, label, Icon }) => {
        const active = tab === id;
        const badge = id === 'orders' && pendingCount > 0;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 relative"
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${active ? 'text-stone-900' : 'text-stone-400'}`} />
              {badge && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-semibold ${active ? 'text-stone-900' : 'text-stone-400'}`}>{label}</span>
            {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-stone-900 rounded-full" />}
          </button>
        );
      })}
    </div>
  );
}