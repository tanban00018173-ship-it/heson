import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Zap, Bell, User } from 'lucide-react';

/**
 * role: 'client' | 'cleaner' | 'admin'
 * 中間的「任務」按鈕是主推，依角色連到不同路徑。
 */
const TABS = {
  client: [
    { id: 'home',     icon: Home,        label: '首頁',  path: '/ClientDashboard' },
    { id: 'shop',     icon: ShoppingBag, label: '商店',  path: '/ClientBooking' },
    { id: 'task',     icon: Zap,         label: '任務',  path: '/FlashTaskPost', primary: true },
    { id: 'notify',   icon: Bell,        label: '通知',  path: '/MyBookings' },
    { id: 'profile',  icon: User,        label: '我的',  path: '/ClientProfile' },
  ],
  cleaner: [
    { id: 'home',     icon: Home,        label: '首頁',  path: '/CleanerJobs' },
    { id: 'shop',     icon: ShoppingBag, label: '商店',  path: '/CleanerJobs?tab=shop' },
    { id: 'task',     icon: Zap,         label: '任務',  path: '/CleanerJobs?tab=map', primary: true },
    { id: 'notify',   icon: Bell,        label: '通知',  path: '/CleanerJobs?tab=team' },
    { id: 'profile',  icon: User,        label: '我的',  path: '/CleanerJobs?tab=profile' },
  ],
  admin: [
    { id: 'home',     icon: Home,        label: '首頁',  path: '/AdminDashboard' },
    { id: 'shop',     icon: ShoppingBag, label: '商店',  path: '/AdminShopProducts' },
    { id: 'task',     icon: Zap,         label: '任務',  path: '/AdminDispatch', primary: true },
    { id: 'notify',   icon: Bell,        label: '通知',  path: '/AdminAttendance' },
    { id: 'profile',  icon: User,        label: '我的',  path: '/AdminUsers' },
  ],
};

export default function BottomNav({ role = 'client' }) {
  const location = useLocation();
  const tabs = TABS[role] || TABS.client;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {tabs.map(({ id, icon: Icon, label, path, primary }) => {
          const isActive = location.pathname === path.split('?')[0];
          if (primary) {
            return (
              <Link key={id} to={path} className="flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 relative">
                <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center -mt-5 shadow-lg shadow-stone-900/30">
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <span className="text-[10px] font-semibold text-stone-700 mt-0.5">{label}</span>
              </Link>
            );
          }
          return (
            <Link key={id} to={path} className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative">
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-stone-900' : 'text-stone-350'}`}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{ color: isActive ? undefined : '#b5b5bd' }}
              />
              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-stone-900' : 'text-stone-400'}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-stone-900 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}