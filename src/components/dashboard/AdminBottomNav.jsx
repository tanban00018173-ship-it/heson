import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Headphones, CalendarDays, Users, User,
  LogIn, LogOut
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  getCurrentPortal,
  getNextPortalPath,
  getPortalIconColor,
  COLOR_CLASSES,
} from '@/lib/portalColor';

// 行程頁面路徑
const SCHEDULE_PATH = '/AdminSchedule';

// 5 tabs 定義
const LEFT_TABS = [
  { id: 'shop',    icon: ShoppingBag, label: '商店',  path: '/AdminShopBackend' },
  { id: 'support', icon: Headphones,  label: '客服',  path: '/AdminSupport' },
];
const RIGHT_TABS = [
  { id: 'dept',    icon: Users, label: '部門',  path: '/AdminDepartment' },
  { id: 'me',      icon: User,  label: '我的',  path: '/AdminMe', isMe: true },
];

export default function AdminBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastClickTime = useRef(0);
  const [user, setUser] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);

  // 打卡狀態（存 sessionStorage 跨頁保留）
  const [clockedIn, setClockedIn] = useState(() => sessionStorage.getItem('admin_clocked_in') === '1');

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) return;
      base44.auth.me().then(async (u) => {
        setUser(u);
        const profiles = await base44.entities.ClientProfile.filter({ user_id: u.id });
        if (profiles?.[0]) setClientProfile(profiles[0]);
      });
    });
  }, []);

  const portal = getCurrentPortal(location.pathname);
  const hasPremium = clientProfile?.subscription_plan && clientProfile.subscription_plan !== '無';
  const iconColor = getPortalIconColor(portal, user?.role, hasPremium);
  // 後台「我的」：有 premium 顯示金色，否則黑色（代表雙擊可切回前台）
  const meIconColor = iconColor ? COLOR_CLASSES[iconColor] : 'text-stone-300';

  const isScheduleActive = location.pathname === SCHEDULE_PATH;

  // 打卡 handler
  const handleClock = (e) => {
    e.preventDefault();
    const next = !clockedIn;
    setClockedIn(next);
    sessionStorage.setItem('admin_clocked_in', next ? '1' : '0');
    // 若不在行程頁，跳過去
    if (location.pathname !== SCHEDULE_PATH) {
      navigate(SCHEDULE_PATH);
    }
  };

  // 中央行程按鈕 navigate
  const handleScheduleNav = () => navigate(SCHEDULE_PATH);

  // 我的 — 雙擊切換台端
  const handleMeClick = () => {
    const now = Date.now();
    const diff = now - lastClickTime.current;
    lastClickTime.current = now;
    if (diff < 400) {
      lastClickTime.current = 0;
      navigate(getNextPortalPath(portal, user?.role));
    } else {
      navigate('/AdminMe');
    }
  };

  const isMeActive = location.pathname === '/AdminMe';
  // 有多台端權限時，icon 常駐顯示目的地顏色（不論選中與否）；無則用預設灰/黑
  const meIconColorClass = iconColor
    ? COLOR_CLASSES[iconColor]
    : (isMeActive ? 'text-stone-900' : 'text-stone-300');

  const isActive = (path) => location.pathname === path;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-end">
        {/* 左側兩個 tab */}
        {LEFT_TABS.map(({ id, icon: Icon, label, path }) => {
          const active = isActive(path);
          return (
            <button key={id} onClick={() => navigate(path)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-colors">
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-stone-900 rounded-full" />}
              <Icon className={`w-5 h-5 transition-colors ${active ? 'text-stone-900' : 'text-stone-300'}`}
                strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-stone-900' : 'text-stone-300'}`}>
                {label}
              </span>
            </button>
          );
        })}

        {/* 中央行程 / 打卡按鈕 */}
        <div className="flex-1 flex flex-col items-center justify-center py-2 relative">
          {/* 行程頁時：打卡 icon；否則：月曆 icon */}
          {isScheduleActive ? (
            /* 打卡狀態切換 */
            <button onClick={handleClock}
              className="flex flex-col items-center justify-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg -mt-5 mb-0.5 transition-all
                ${clockedIn
                  ? 'bg-stone-500 shadow-stone-400/40'
                  : 'bg-stone-900 shadow-stone-900/30'}`}>
                {clockedIn
                  ? <LogOut className="w-6 h-6 text-white" strokeWidth={2.5} />
                  : <LogIn  className="w-6 h-6 text-white" strokeWidth={2.5} />
                }
              </div>
              <span className="text-[10px] font-semibold text-stone-700">
                {clockedIn ? '下班' : '上班'}
              </span>
            </button>
          ) : (
            /* 一般：月曆按鈕 navigate */
            <button onClick={handleScheduleNav}
              className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center shadow-lg shadow-stone-900/30 -mt-5 mb-0.5">
                <CalendarDays className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-semibold text-stone-700">行程</span>
            </button>
          )}
          {/* 行程 active indicator */}
          {isScheduleActive && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-stone-900 rounded-full" />
          )}
        </div>

        {/* 右側：部門 */}
        {RIGHT_TABS.slice(0, 1).map(({ id, path, label }) => {
          const active = isActive(path);
          return (
            <button key={id} onClick={() => navigate(path)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-colors">
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-stone-900 rounded-full" />}
              <Users className={`w-5 h-5 transition-colors ${active ? 'text-stone-900' : 'text-stone-300'}`}
                strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-stone-900' : 'text-stone-300'}`}>
                {label}
              </span>
            </button>
          );
        })}

        {/* 右側：我的（雙擊切台） */}
        <button onClick={handleMeClick}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-colors">
          {isMeActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-stone-900 rounded-full" />}
          <User className={`w-5 h-5 transition-colors ${meIconColorClass}`}
            strokeWidth={isMeActive ? 2.5 : 1.8} />
          <span className={`text-[10px] font-medium transition-colors ${isMeActive ? 'text-stone-900' : 'text-stone-300'}`}>
            我的
          </span>
        </button>
      </div>
    </div>
  );
}