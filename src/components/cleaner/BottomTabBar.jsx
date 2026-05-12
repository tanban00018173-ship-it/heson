import React from 'react';
import { Map, ShoppingBag, Award, Users, User } from 'lucide-react';

const TABS = [
  { id: 'shop',    icon: ShoppingBag, label: '商店' },
  { id: 'skills',  icon: Award,       label: '技能' },
  { id: 'map',     icon: Map,         label: '地圖' },
  { id: 'team',    icon: Users,       label: '團隊' },
  { id: 'profile', icon: User,        label: '我的' },
];

export default function BottomTabBar({ activeTab, onTabChange }) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {TABS.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-amber-500' : 'text-stone-400'}`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-amber-500' : 'text-stone-400'}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}