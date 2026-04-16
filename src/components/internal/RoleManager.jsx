import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Check, Crown, Briefcase, User, Users } from "lucide-react";

const ROLES = [
  {
    value: 'admin',
    label: '管理員',
    description: '完整後台存取權限',
    icon: Crown,
    color: 'bg-red-100 text-red-700 border-red-200',
    badgeClass: 'bg-red-100 text-red-700',
  },
  {
    value: 'partner',
    label: '工作夥伴',
    description: '可存取工作相關功能',
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  {
    value: 'user',
    label: '會員',
    description: '一般會員功能',
    icon: User,
    color: 'bg-green-100 text-green-700 border-green-200',
    badgeClass: 'bg-green-100 text-green-700',
  },
];

function getRoleInfo(role) {
  return ROLES.find(r => r.value === role) || {
    label: '訪客',
    badgeClass: 'bg-stone-100 text-stone-500',
  };
}

function RoleSelector({ currentRole, userId, onSuccess }) {
  const [saving, setSaving] = useState(null);
  const queryClient = useQueryClient();

  const handleChange = async (newRole) => {
    if (newRole === currentRole) return;
    setSaving(newRole);
    await base44.functions.invoke('updateUserRole', { userId, role: newRole });
    queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    onSuccess && onSuccess();
    setSaving(null);
  };

  return (
    <div className="flex gap-1.5 flex-wrap">
      {ROLES.map(r => {
        const Icon = r.icon;
        const isActive = currentRole === r.value;
        const isSaving = saving === r.value;
        return (
          <button
            key={r.value}
            onClick={() => handleChange(r.value)}
            disabled={!!saving}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isActive
                ? r.color + ' shadow-sm'
                : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isActive ? (
              <Check className="w-3 h-3" />
            ) : (
              <Icon className="w-3 h-3" />
            )}
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

export default function RoleManager() {
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const res = await base44.functions.invoke('listAllUsers', { _: 1 });
      return res.data?.users || [];
    },
  });

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  const roleStats = {
    admin: users.filter(u => u.role === 'admin').length,
    partner: users.filter(u => u.role === 'partner').length,
    user: users.filter(u => u.role === 'user' || !u.role).length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="p-4 border-b border-stone-100 bg-white flex gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-stone-400" />
          <span className="text-stone-500">共 <strong className="text-stone-800">{users.length}</strong> 位用戶</span>
        </div>
        {ROLES.map(r => (
          <div key={r.value} className="flex items-center gap-1.5">
            <Badge className={r.badgeClass + ' text-xs'}>{r.label}</Badge>
            <span className="text-sm font-medium text-stone-700">{roleStats[r.value] || 0}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <Badge className="bg-stone-100 text-stone-500 text-xs">訪客（未登入）</Badge>
          <span className="text-xs text-stone-400">不記錄</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b border-stone-100">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋姓名、Email 或角色..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            {search ? '找不到符合的用戶' : '目前無用戶資料'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => {
              const roleInfo = getRoleInfo(u.role);
              return (
                <div key={u.id} className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-stone-600">
                        {(u.full_name || u.email || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-stone-800 text-sm">{u.full_name || '（未設定姓名）'}</span>
                        <Badge className={`${roleInfo.badgeClass} text-xs`}>{roleInfo.label}</Badge>
                      </div>
                      <p className="text-xs text-stone-400 truncate">{u.email}</p>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="sm:flex-shrink-0">
                    <RoleSelector currentRole={u.role} userId={u.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note */}
      <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-400">
        💡 訪客（未登入者）不會出現在此清單，也不記錄任何資料。點擊角色按鈕即可立即切換，無需額外確認。
      </div>
    </div>
  );
}