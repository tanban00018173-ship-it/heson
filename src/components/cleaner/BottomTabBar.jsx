import React from 'react';
import { Home, ShoppingBag, Zap, Users, User } from 'lucide-react';

const TABS = [
  { id: 'home',    icon: Home,        label: '首頁' },
  { id: 'shop',    icon: ShoppingBag, label: '商店' },
  { id: 'map',     icon: Zap,         label: '任務', primary: true },
  { id: 'team',    icon: Users,       label: '訊息' },
  { id: 'profile', icon: User,        label: '我的' },
];

export default function BottomTabBar({ activeTab, onTabChange }) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {TABS.map(({ id, icon: Icon, label, primary }) => {
          const isActive = activeTab === id;
          if (primary) {
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className="flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center -mt-5 shadow-lg transition-colors ${isActive ? 'bg-amber-500 shadow-amber-500/40' : 'bg-stone-900 shadow-stone-900/30'}`}>
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'text-amber-500' : 'text-stone-700'}`}>{label}</span>
              </button>
            );
          }
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-stone-900' : 'text-stone-300'}`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-stone-900' : 'text-stone-400'}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-stone-900 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}