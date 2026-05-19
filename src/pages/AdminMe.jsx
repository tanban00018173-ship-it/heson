import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import AdminBottomNav from '@/components/dashboard/AdminBottomNav';
import { resolvePermissions, PERMISSION_KEYS } from '@/lib/adminPermissions';
import {
  LogOut, ChevronRight, Shield, Users, ClipboardList,
  BarChart3, Wrench, DollarSign, Calendar, Lock, UserCog, Home
} from 'lucide-react';

const PERM_LINKS = {
  bookings:  { icon: ClipboardList, label: '預約管理',   path: '/AdminDispatch',       color: 'bg-blue-50 text-blue-600' },
  dispatch:  { icon: Calendar,      label: '派單管理',   path: '/AdminDispatch',       color: 'bg-yellow-50 text-yellow-600' },
  cleaners:  { icon: Users,         label: '管理師管理', path: '/AdminCleaners',       color: 'bg-teal-50 text-teal-600' },
  clients:   { icon: Users,         label: '客戶管理',   path: '/AdminClients',        color: 'bg-violet-50 text-violet-600' },
  finance:   { icon: DollarSign,    label: '財務管理',   path: '/AdminDashboard',      color: 'bg-green-50 text-green-600' },
  tools:     { icon: Wrench,        label: '內部工具',   path: '/InternalSpreadsheet', color: 'bg-amber-50 text-amber-600' },
  users:     { icon: UserCog,       label: '人員管理',   path: '/AdminUsers',          color: 'bg-stone-50 text-stone-600' },
  settings:  { icon: Shield,        label: '權限設定',   path: '/AdminPermissions',    color: 'bg-red-50 text-red-600' },
};

const LEVEL_LABEL = { member: '成員', manager: '管理員', operator: '操作者' };
const LEVEL_COLOR = { member: 'bg-stone-100 text-stone-600', manager: 'bg-blue-100 text-blue-700', operator: 'bg-amber-100 text-amber-700' };

export default function AdminMe() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) { base44.auth.redirectToLogin(); return; }
      base44.auth.me().then(setUser);
    });
  }, []);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full" />
    </div>
  );

  const level = user?.admin_level || 'member';
  const perms = resolvePermissions(user);
  const allowedPerms = PERMISSION_KEYS.filter(pk => perms[pk.key]);
  const avatarLetter = user?.full_name?.[0]?.toUpperCase() || 'A';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-stone-900 pt-10 pb-5 px-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-stone-700 border-2 border-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold">{avatarLetter}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold truncate">{user?.full_name || '管理員'}</p>
            <p className="text-white/40 text-xs truncate">{user?.email}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${LEVEL_COLOR[level] || LEVEL_COLOR.member}`}>
            {LEVEL_LABEL[level] || level}
          </span>
        </div>
        <div className="mt-4 bg-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-white/60 flex-shrink-0" />
          <p className="text-white/70 text-xs">後台成員 · 已授權 {allowedPerms.length} 項功能</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        <div className="p-4 space-y-3">

          {/* 我的功能（依權限） */}
          <div className="bg-white rounded-xl overflow-hidden border border-stone-100">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">我的功能</p>
            {allowedPerms.map(pk => {
              const link = PERM_LINKS[pk.key];
              if (!link) return null;
              const Icon = link.icon;
              return (
                <button key={pk.key} onClick={() => navigate(link.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors border-t border-stone-50">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${link.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-stone-800">{pk.label}</p>
                    <p className="text-xs text-stone-400">{pk.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300" />
                </button>
              );
            })}
            {allowedPerms.length === 0 && (
              <p className="px-4 pb-4 text-sm text-stone-400">目前無任何功能權限。</p>
            )}
          </div>

          {/* 帳號管理（operator/manager） */}
          {(level === 'operator' || level === 'manager') && (
            <div className="bg-white rounded-xl overflow-hidden border border-stone-100">
              <p className="px-4 pt-4 pb-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">帳號 & 系統</p>
              {[
                level === 'operator' && { icon: Shield,   label: '權限管理', desc: '調整成員權限',   path: '/AdminPermissions', iconColor: 'bg-amber-50 text-amber-600' },
                level === 'operator' && { icon: UserCog,  label: '人員清單', desc: '查看後台成員',   path: '/AdminUsers',       iconColor: 'bg-stone-50 text-stone-600' },
                { icon: BarChart3, label: '後台總覽', desc: '回到管理主頁', path: '/AdminDashboard', iconColor: 'bg-blue-50 text-blue-600' },
              ].filter(Boolean).map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.label} onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors border-t border-stone-50">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-stone-800">{item.label}</p>
                      <p className="text-xs text-stone-400">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </button>
                );
              })}
            </div>
          )}

          {/* 切換台端 */}
          <div className="bg-white rounded-xl overflow-hidden border border-stone-100">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">切換台端</p>
            <button onClick={() => navigate('/Home')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors border-t border-stone-50">
              <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                <Home className="w-4 h-4 text-stone-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-stone-800">前往前台</p>
                <p className="text-xs text-stone-400">切換至客戶端首頁</p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </button>
          </div>

          {/* 登出 */}
          <button onClick={() => base44.auth.logout()}
            className="w-full bg-white rounded-xl p-4 flex items-center gap-3 border border-stone-100 hover:bg-stone-50 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-stone-500" />
            </div>
            <span className="text-sm font-medium text-stone-600">登出</span>
          </button>
        </div>
      </div>

      <AdminBottomNav />
    </div>
  );
}