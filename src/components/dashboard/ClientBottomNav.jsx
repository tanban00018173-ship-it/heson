import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ShoppingBag, Zap, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';

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
                {/* 光暈脈衝 */}
                <div className="relative -mt-6 mb-0.5">
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gold-400"
                    animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gold-300"
                    animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                  />
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #e8c96a 0%, #c9a84c 50%, #a87c2a 100%)', boxShadow: '0 4px 20px rgba(201,168,76,0.6)' }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Zap className="w-7 h-7 text-white drop-shadow" strokeWidth={2.5} fill="white" />
                    </motion.div>
                  </motion.div>
                </div>
                <span className="text-[10px] font-bold text-gold-600 tracking-wide">閃電任務</span>
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