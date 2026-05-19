import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, ChevronDown, ChevronUp, User, Info } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import AdminBottomNav from '@/components/dashboard/AdminBottomNav';
import { createPageUrl } from '@/utils';
import {
  ROLE_CATEGORIES,
  ROLE_MAP,
  ADMIN_LEVELS,
  PERMISSION_KEYS,
  DEFAULT_PERMISSIONS,
  resolvePermissions,
} from '@/lib/adminPermissions';

// 後台等級 badge 顏色
const LEVEL_COLORS = {
  member:   'bg-stone-100 text-stone-600',
  manager:  'bg-blue-100 text-blue-700',
  operator: 'bg-amber-100 text-amber-800',
};

// 依 role 決定顯示在哪個分類
function categorizeUsers(users) {
  const result = { backend: [], midend: [], frontend: [], banned: [] };
  for (const u of users) {
    if (u.role === 'admin') result.backend.push(u);
    else if (u.role === 'cleaner') result.midend.push(u);
    else if (u.role === 'suspended' || u.role === 'banned_ip') result.banned.push(u);
    else result.frontend.push(u);
  }
  return result;
}

function UserPermissionRow({ adminUser, canEdit, onLevelChange, onPermissionChange }) {
  const [expanded, setExpanded] = useState(false);
  const effective = resolvePermissions(adminUser);
  const overrides = adminUser.admin_permissions || {};

  return (
    <div className="border border-stone-100 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 bg-white cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-stone-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-stone-800 text-sm truncate">{adminUser.full_name || '未命名'}</p>
          <p className="text-xs text-stone-400 truncate">{adminUser.email}</p>
        </div>
        <div onClick={e => e.stopPropagation()}>
          {canEdit ? (
            <Select value={adminUser.admin_level || 'member'} onValueChange={val => onLevelChange(adminUser.id, val)}>
              <SelectTrigger className="w-28 h-8 text-xs border-stone-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ADMIN_LEVELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge className={LEVEL_COLORS[adminUser.admin_level || 'member']}>
              {ADMIN_LEVELS[adminUser.admin_level || 'member']}
            </Badge>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-stone-100 bg-stone-50 px-4 py-3">
          <p className="text-xs text-stone-400 mb-3 flex items-center gap-1">
            <Info className="w-3 h-3" />
            橘色切換鈕代表已個別覆寫預設值
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PERMISSION_KEYS.map(({ key, label, desc }) => {
              const defaultVal = DEFAULT_PERMISSIONS[adminUser.admin_level || 'member'][key];
              const isOverridden = key in overrides;
              const currentVal = effective[key];
              return (
                <div key={key} className={`flex items-center justify-between p-2.5 rounded-lg bg-white border ${isOverridden ? 'border-amber-200' : 'border-stone-100'}`}>
                  <div>
                    <p className="text-sm font-medium text-stone-700">{label}</p>
                    <p className="text-xs text-stone-400">{desc}</p>
                  </div>
                  {canEdit ? (
                    <Switch
                      checked={currentVal}
                      onCheckedChange={val => onPermissionChange(adminUser.id, key, val, defaultVal)}
                      className={isOverridden ? 'data-[state=checked]:bg-amber-500' : ''}
                    />
                  ) : (
                    <Badge className={currentVal ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-400'}>
                      {currentVal ? '允許' : '禁止'}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 一般用戶 row（前台/中台/封禁）
function SimpleUserRow({ user, roleLabel, roleColor }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-stone-100 rounded-xl">
      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-stone-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate">{user.full_name || '未命名'}</p>
        <p className="text-xs text-stone-400 truncate">{user.email}</p>
      </div>
      <Badge className={roleColor}>{roleLabel}</Badge>
    </div>
  );
}

// 分類區塊
function CategorySection({ title, colorClass, borderClass, children }) {
  return (
    <div className={`rounded-2xl border-2 ${borderClass} overflow-hidden`}>
      <div className={`px-4 py-2.5 ${colorClass}`}>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-3 space-y-2 bg-white min-h-[60px]">
        {children}
      </div>
    </div>
  );
}

const CATEGORY_STYLES = {
  backend:  { colorClass: 'bg-amber-50 text-amber-800',   borderClass: 'border-amber-200' },
  midend:   { colorClass: 'bg-teal-50 text-teal-800',     borderClass: 'border-teal-200' },
  frontend: { colorClass: 'bg-violet-50 text-violet-800', borderClass: 'border-violet-200' },
  banned:   { colorClass: 'bg-red-50 text-red-800',       borderClass: 'border-red-200' },
};

const CATEGORY_LABELS = { backend: '後台', midend: '中台', frontend: '前台', banned: '封禁' };

// 角色 label + color for non-admin
const ROLE_DISPLAY = {
  cleaner:    { label: '師傅',   color: 'bg-teal-100 text-teal-700' },
  helper:     { label: '小幫手', color: 'bg-cyan-100 text-cyan-700' },
  vip:        { label: '會員',   color: 'bg-violet-100 text-violet-700' },
  user:       { label: '用戶',   color: 'bg-gray-100 text-gray-600' },
  banned_ip:  { label: 'BanIP', color: 'bg-red-100 text-red-700' },
  suspended:  { label: '停權',   color: 'bg-rose-100 text-rose-700' },
};

export default function AdminPermissions() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u || u.role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setCurrentUser(u);
    });
  }, []);

  const { data: allUsers, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => base44.functions.invoke('listAllUsers', {}).then(r => r.data?.users || []),
    initialData: [],
  });

  const categorized = categorizeUsers(allUsers || []);
  const isOperator = currentUser?.admin_level === 'operator';

  const updateLevel = async (userId, level) => {
    await base44.functions.invoke('updateUserRole', { userId, role: 'admin', admin_level: level });
    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
  };

  const updatePermission = async (userId, key, value, defaultVal) => {
    const target = (allUsers || []).find(u => u.id === userId);
    const overrides = { ...(target?.admin_permissions || {}) };
    if (value === defaultVal) delete overrides[key];
    else overrides[key] = value;
    await base44.functions.invoke('updateUserRole', { userId, role: 'admin', admin_permissions: overrides });
    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <div className="hidden lg:block">
        <Sidebar userRole="admin" userName={currentUser?.full_name} />
      </div>
      <MobileNav userRole="admin" userName={currentUser?.full_name} />
      <AdminBottomNav />

      <main className="flex-1 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-amber-600" />
              <h1 className="text-xl lg:text-2xl font-medium text-stone-800">權限管理</h1>
            </div>
            <p className="text-sm text-stone-400">全平台用戶角色分類與後台細部權限設定</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* 後台 */}
              <CategorySection title="後台" {...CATEGORY_STYLES.backend}>
                <div className="mb-1 text-xs text-stone-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  操作者等級可修改其他人的細部權限
                </div>
                {categorized.backend.length === 0 ? (
                  <p className="text-xs text-stone-300 py-3 text-center">尚無後台人員</p>
                ) : (
                  categorized.backend.map(u => (
                    <UserPermissionRow
                      key={u.id}
                      adminUser={u}
                      canEdit={isOperator && u.id !== currentUser.id}
                      onLevelChange={updateLevel}
                      onPermissionChange={updatePermission}
                    />
                  ))
                )}
              </CategorySection>

              {/* 中台 */}
              <CategorySection title="中台" {...CATEGORY_STYLES.midend}>
                {categorized.midend.length === 0 ? (
                  <p className="text-xs text-stone-300 py-3 text-center">尚無中台人員</p>
                ) : (
                  categorized.midend.map(u => {
                    const rd = ROLE_DISPLAY[u.role] || { label: u.role, color: 'bg-stone-100 text-stone-600' };
                    return <SimpleUserRow key={u.id} user={u} roleLabel={rd.label} roleColor={rd.color} />;
                  })
                )}
              </CategorySection>

              {/* 前台 */}
              <CategorySection title="前台" {...CATEGORY_STYLES.frontend}>
                {categorized.frontend.length === 0 ? (
                  <p className="text-xs text-stone-300 py-3 text-center">尚無前台用戶</p>
                ) : (
                  categorized.frontend.map(u => {
                    const rd = ROLE_DISPLAY[u.role] || { label: '用戶', color: 'bg-gray-100 text-gray-600' };
                    return <SimpleUserRow key={u.id} user={u} roleLabel={rd.label} roleColor={rd.color} />;
                  })
                )}
              </CategorySection>

              {/* 封禁 */}
              <CategorySection title="封禁" {...CATEGORY_STYLES.banned}>
                {categorized.banned.length === 0 ? (
                  <p className="text-xs text-stone-300 py-3 text-center">無封禁用戶</p>
                ) : (
                  categorized.banned.map(u => {
                    const rd = ROLE_DISPLAY[u.role] || { label: '封禁', color: 'bg-red-100 text-red-700' };
                    return <SimpleUserRow key={u.id} user={u} roleLabel={rd.label} roleColor={rd.color} />;
                  })
                )}
              </CategorySection>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}