import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  ADMIN_LEVELS,
  PERMISSION_KEYS,
  DEFAULT_PERMISSIONS,
  resolvePermissions,
} from '@/lib/adminPermissions';

const LEVEL_COLORS = {
  member:   'bg-stone-100 text-stone-600',
  manager:  'bg-blue-100 text-blue-700',
  operator: 'bg-amber-100 text-amber-700',
};

function UserPermissionRow({ adminUser, canEdit, onLevelChange, onPermissionChange }) {
  const [expanded, setExpanded] = useState(false);
  const effective = resolvePermissions(adminUser);
  const overrides = adminUser.admin_permissions || {};

  return (
    <div className="border border-stone-100 rounded-xl overflow-hidden">
      {/* Header row */}
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

        {/* Level selector */}
        <div onClick={e => e.stopPropagation()}>
          {canEdit ? (
            <Select
              value={adminUser.admin_level || 'member'}
              onValueChange={val => onLevelChange(adminUser.id, val)}
            >
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

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />
        )}
      </div>

      {/* Permissions detail */}
      {expanded && (
        <div className="border-t border-stone-100 bg-stone-50 px-4 py-3">
          <p className="text-xs text-stone-400 mb-3 flex items-center gap-1">
            <Info className="w-3 h-3" />
            灰色項目來自等級預設值；橘色切換鈕代表已個別覆寫
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PERMISSION_KEYS.map(({ key, label, desc }) => {
              const defaultVal = DEFAULT_PERMISSIONS[adminUser.admin_level || 'member'][key];
              const isOverridden = key in overrides;
              const currentVal = effective[key];

              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-2.5 rounded-lg bg-white border ${isOverridden ? 'border-amber-200' : 'border-stone-100'}`}
                >
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

  // Only admin users
  const adminUsers = (allUsers || []).filter(u => u.role === 'admin');

  const isOperator = currentUser?.admin_level === 'operator';

  const updateLevel = async (userId, level) => {
    await base44.functions.invoke('updateUserRole', { userId, role: 'admin', admin_level: level });
    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
  };

  const updatePermission = async (userId, key, value, defaultVal) => {
    // Find current user's overrides
    const target = adminUsers.find(u => u.id === userId);
    const overrides = { ...(target?.admin_permissions || {}) };
    if (value === defaultVal) {
      // Same as default → remove override
      delete overrides[key];
    } else {
      overrides[key] = value;
    }
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
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-amber-600" />
              <h1 className="text-xl lg:text-2xl font-medium text-stone-800">後台權限管理</h1>
            </div>
            <p className="text-sm text-stone-500">設定後台人員等級與細部存取權限</p>
          </div>

          {/* Level explanation */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Object.entries(ADMIN_LEVELS).map(([level, label]) => (
              <Card key={level} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <Badge className={`${LEVEL_COLORS[level]} mb-2`}>{label}</Badge>
                  <ul className="space-y-1 mt-2">
                    {PERMISSION_KEYS.map(({ key, label: pLabel }) => {
                      const allowed = DEFAULT_PERMISSIONS[level][key];
                      return (
                        <li key={key} className={`text-xs ${allowed ? 'text-stone-600' : 'text-stone-300 line-through'}`}>
                          {pLabel}
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* User list */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">後台人員清單</CardTitle>
              {!isOperator && (
                <p className="text-xs text-stone-400 mt-1">僅「操作者」等級可修改設定</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
                </div>
              ) : adminUsers.length === 0 ? (
                <p className="text-center text-stone-400 py-6 text-sm">尚無後台人員</p>
              ) : (
                adminUsers.map(u => (
                  <UserPermissionRow
                    key={u.id}
                    adminUser={u}
                    canEdit={isOperator && u.id !== currentUser.id}
                    onLevelChange={updateLevel}
                    onPermissionChange={updatePermission}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}