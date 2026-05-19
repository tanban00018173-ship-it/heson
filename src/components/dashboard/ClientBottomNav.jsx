import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ShoppingBag, Zap, Bell, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TABS = [
  { id: 'home',    icon: Home,        label: '首頁',  path: 'Home' },
  { id: 'shop',    icon: ShoppingBag, label: '商店',  path: 'ClientShop' },
  { id: 'task',    icon: Zap,         label: '任務',  path: 'FlashTaskPost', primary: true },
  { id: 'notify',  icon: Bell,        label: '通知',  path: 'MyBookings' },
];

function getNextPortal(currentPath, role) {
  if (currentPath.startsWith('/Admin')) return '/Home';
  if (currentPath.startsWith('/Cleaner')) {
    return role === 'admin' ? '/AdminDashboard' : '/Home';
  }
  // 前台 → 中台
  return '/CleanerJobs';
}

export default function ClientBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const clickTimer = useRef(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      if (auth) base44.auth.me().then(u => setUser(u));
    });
  }, []);

  const hasPortalAccess = user?.role === 'admin' || user?.role === 'cleaner';

  const handleProfileClick = () => {
    if (!hasPortalAccess) {
      navigate(createPageUrl('ClientProfile'));
      return;
    }
    const newCount = clickCount + 1;
    setClickCount(newCount);
    clearTimeout(clickTimer.current);
    if (newCount >= 2) {
      setClickCount(0);
      const dest = getNextPortal(location.pathname, user.role);
      navigate(dest);
    } else {
      clickTimer.current = setTimeout(() => {
        setClickCount(0);
        navigate(createPageUrl('ClientProfile'));
      }, 400);
    }
  };

  const profilePath = 'ClientProfile';
  const isProfileActive = location.pathname === `/${profilePath}` || location.pathname.includes(profilePath);

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {TABS.map(({ id, icon: Icon, label, path, primary }) => {
          const href = createPageUrl(path);
          const isActive = location.pathname === `/${path}` || location.pathname.includes(path);

          if (primary) {
            return (
              <Link key={id} to={href} className="flex-1 flex flex-col items-center justify-center py-2 relative">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/40 -mt-5 mb-0.5">
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold text-black">{label}</span>
              </Link>
            );
          }

          return (
            <Link key={id} to={href} className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative">
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-stone-900 rounded-full" />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-stone-900' : 'text-stone-300'}`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-stone-900' : 'text-stone-300'}`}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* 我的 — 雙擊切換台端 */}
        <button
          onClick={handleProfileClick}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative"
        >
          {isProfileActive && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-stone-900 rounded-full" />
          )}
          <User
            className={`w-5 h-5 transition-colors ${isProfileActive ? 'text-stone-900' : 'text-stone-300'}`}
            strokeWidth={isProfileActive ? 2.5 : 1.8}
          />
          <span className={`text-[10px] font-medium transition-colors ${isProfileActive ? 'text-stone-900' : 'text-stone-300'}`}>
            我的
          </span>
        </button>
      </div>
    </div>
  );
}