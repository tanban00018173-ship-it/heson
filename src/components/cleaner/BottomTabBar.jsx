import React, { useRef } from 'react';
import { Map, ShoppingBag, Award, Users, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { id: 'shop',    icon: ShoppingBag, label: '商店' },
  { id: 'skills',  icon: Award,       label: '技能' },
  { id: 'map',     icon: Map,         label: '任務',  primary: true },
  { id: 'team',    icon: Users,       label: '訊息' },
];

// 中台 → 後台(admin) → 前台 → 中台
function getNextPortal(role) {
  // 目前在中台，下一步看 role
  return role === 'admin' ? '/AdminDashboard' : '/Home';
}

export default function BottomTabBar({ activeTab, onTabChange, user }) {
  const navigate = useNavigate();
  const lastClickTime = useRef(0);
  const hasPortalAccess = user?.role === 'admin' || user?.role === 'cleaner';

  const handleProfileClick = () => {
    if (!hasPortalAccess) {
      onTabChange('profile');
      return;
    }
    const now = Date.now();
    const diff = now - lastClickTime.current;
    lastClickTime.current = now;

    if (diff < 400) {
      lastClickTime.current = 0;
      navigate(getNextPortal(user.role));
    } else {
      onTabChange('profile');
    }
  };
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
                className="flex-1 flex flex-col items-center justify-center py-2 relative"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg -mt-5 mb-0.5 transition-all ${
                  isActive ? 'bg-black shadow-black/30' : 'bg-stone-700 shadow-stone-700/30'
                }`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-black' : 'text-stone-500'}`}>{label}</span>
              </button>
            );
          }

          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-black rounded-full" />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-black' : 'text-stone-300'}`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-black' : 'text-stone-300'}`}>
                {label}
              </span>
            </button>
          );
        })}

        {/* 我的 — 雙擊切換台端 */}
        <button
          onClick={handleProfileClick}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative"
        >
          {activeTab === 'profile' && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-black rounded-full" />
          )}
          <div className="relative">
            <User
              className={`w-5 h-5 transition-colors ${activeTab === 'profile' ? 'text-black' : 'text-stone-300'}`}
              strokeWidth={activeTab === 'profile' ? 2.5 : 1.8}
            />
            {hasPortalAccess && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </div>
          <span className={`text-xs font-medium transition-colors ${activeTab === 'profile' ? 'text-black' : 'text-stone-300'}`}>
            我的
          </span>
        </button>
      </div>
    </div>
  );
}