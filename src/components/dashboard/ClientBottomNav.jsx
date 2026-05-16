import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ShoppingBag, Zap, Bell, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TABS = [
  { id: 'home',    icon: Home,        label: '首頁',  path: 'Home' },
  { id: 'shop',    icon: ShoppingBag, label: '商店',  path: 'ClientShop' },
  { id: 'task',    icon: Zap,         label: '任務',  path: 'FlashTaskPost', primary: true },
  { id: 'notify',  icon: Bell,        label: '通知',  path: 'MyBookings' },
  { id: 'profile', icon: User,        label: '我的',  path: 'ClientProfile' },
];

export default function ClientBottomNav() {
  const location = useLocation();

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
                <div className="w-12 h-12 bg-gold-500 rounded-2xl flex items-center justify-center shadow-lg shadow-gold-500/40 -mt-5 mb-0.5">
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold text-gold-500">{label}</span>
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
      </div>
    </div>
  );
}