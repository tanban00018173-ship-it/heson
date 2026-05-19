import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart3, Calendar, Plus, Users, Wrench, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  getCurrentPortal,
  getNextPortalPath,
  getPortalIconColor,
  COLOR_CLASSES,
} from '@/lib/portalColor';

const TABS = [
  { id: 'dashboard', icon: BarChart3, label: '總覽', path: 'AdminDashboard' },
  { id: 'dispatch',  icon: Calendar,  label: '派單', path: 'AdminDispatch' },
  { id: 'new',       icon: Plus,      label: '新預約', path: 'BookingForm', primary: true },
  { id: 'clients',   icon: Users,     label: '客戶', path: 'AdminClients' },
  { id: 'tools',     icon: Wrench,    label: '工具', path: 'InternalSpreadsheet' },
];

export default function AdminBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastClickTime = useRef(0);
  const [user, setUser] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);

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

  const profilePath = '/ClientProfile';
  const isProfileActive = location.pathname === profilePath || location.pathname.includes('ClientProfile');

  const handleProfileClick = () => {
    const now = Date.now();
    const diff = now - lastClickTime.current;
    lastClickTime.current = now;

    if (diff < 400) {
      lastClickTime.current = 0;
      navigate(getNextPortalPath(portal, user?.role));
    } else {
      navigate(profilePath);
    }
  };

  // 未選中時維持灰色；選中時才顯示目的地顏色
  const iconColorClass = isProfileActive
    ? (iconColor ? COLOR_CLASSES[iconColor] : 'text-stone-900')
    : 'text-stone-300';

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {TABS.map(({ id, icon: Icon, label, path, primary }) => {
          const href = path.startsWith('/') ? path : `/${path}`;
          const isActive = location.pathname.includes(path);

          if (primary) {
            return (
              <Link key={id} to={href} className="flex-1 flex flex-col items-center justify-center py-2 relative">
                <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center shadow-lg shadow-stone-900/30 -mt-5 mb-0.5">
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold text-stone-700">{label}</span>
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
            className={`w-5 h-5 transition-colors ${iconColorClass}`}
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