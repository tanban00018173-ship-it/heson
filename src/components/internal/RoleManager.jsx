import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Check, Crown, Briefcase, User, Users, ShieldBan, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ROLES = [
  {
    value: 'admin',
    label: '管理員',
    icon: Crown,
    color: 'bg-red-100 text-red-700 border-red-200',
    badgeClass: 'bg-red-100 text-red-700',
  },
  {
    value: 'partner',
    label: '工作夥伴',
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  {
    value: 'user',
    label: '會員',
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

function UserCard({ u, bannedEmails, onBanToggle }) {
  const [saving, setSaving] = useState(null);
  const queryClient = useQueryClient();
  const isBanned = bannedEmails.has(u.email);
  const roleInfo = getRoleInfo(u.role);

  const handleRoleChange = async (newRole) => {
    if (newRole === u.role) return;
    setSaving(newRole);
    await base44.functions.invoke('updateUserRole', { userId: u.id, role: newRole });
    queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    setSaving(null);
  };

  return (
    <div className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${isBanned ? 'border-red-200 bg-red-50/20' : 'border-stone-200'}`}>
      {/* Avatar + Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isBanned ? 'bg-red-100' : 'bg-stone-100'}`}>
          {isBanned
            ? <ShieldBan className="w-4 h-4 text-red-500" />
            : <span className="text-sm font-medium text-stone-600">{(u.full_name || u.email || '?')[0].toUpperCase()}</span>
          }
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-stone-800 text-sm">{u.full_name || '（未設定姓名）'}</span>
            {isBanned
              ? <Badge className="bg-red-100 text-red-700 text-xs">封禁</Badge>
              : <Badge className={`${roleInfo.badgeClass} text-xs`}>{roleInfo.label}</Badge>
            }
          </div>
          <p className="text-xs text-stone-400 truncate">{u.email}</p>
        </div>
      </div>

      {/* Role + Ban controls */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-shrink-0">
        {/* Role buttons — disabled if banned */}
        {!isBanned && ROLES.map(r => {
          const Icon = r.icon;
          const isActive = u.role === r.value;
          const isSaving = saving === r.value;
          return (
            <button
              key={r.value}
              onClick={() => handleRoleChange(r.value)}
              disabled={!!saving}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isActive
                  ? r.color + ' shadow-sm'
                  : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700'
              }`}
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : isActive ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              {r.label}
            </button>
          );
        })}

        {/* Divider */}
        {!isBanned && <div className="h-5 w-px bg-stone-200 hidden sm:block" />}

        {/* Ban / Unban button */}
        {isBanned ? (
          <button
            onClick={() => onBanToggle(u, false)}
            disabled={!!saving}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all bg-white border-green-300 text-green-700 hover:bg-green-50"
          >
            <ShieldCheck className="w-3 h-3" />
            解除封禁
          </button>
        ) : (
          <button
            onClick={() => onBanToggle(u, true)}
            disabled={!!saving}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all bg-white border-red-300 text-red-600 hover:bg-red-50"
          >
            <ShieldBan className="w-3 h-3" />
            封禁
          </button>
        )}
      </div>
    </div>
  );
}

export default function RoleManager() {
  const [search, setSearch] = useState('');
  const [confirmBan, setConfirmBan] = useState(null); // { user, action }
  const [banReason, setBanReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const res = await base44.functions.invoke('listAllUsers', { _: 1 });
      return res.data?.users || [];
    },
  });

  // Fetch all banned devices to derive banned emails
  const { data: bannedDevices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['bannedDevices'],
    queryFn: async () => {
      const res = await base44.functions.invoke('listBannedDevices', { _: 1 });
      return res.data?.devices || [];
    },
  });

  const bannedEmails = new Set(
    bannedDevices
      .filter(d => d.is_active)
      .flatMap(d => d.associated_emails || [])
  );

  const isLoading = usersLoading || devicesLoading;

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
    banned: bannedEmails.size,
  };

  const handleBanToggle = (user, shouldBan) => {
    if (shouldBan) {
      setConfirmBan({ user, action: 'ban' });
      setBanReason('');
    } else {
      setConfirmBan({ user, action: 'unban' });
      setBanReason('');
    }
  };

  const executeBan = async () => {
    if (!confirmBan) return;
    setProcessing(true);
    const { user, action } = confirmBan;
    if (action === 'ban') {
      await base44.functions.invoke('banDevice', {
        action: 'banByEmail',
        email: user.email,
        reason: banReason || '帳號封禁',
      });
    } else {
      await base44.functions.invoke('banDevice', {
        action: 'unbanByEmail',
        email: user.email,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['bannedDevices'] });
    setConfirmBan(null);
    setProcessing(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="p-4 border-b border-stone-100 bg-white flex gap-4 flex-wrap items-center">
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
          <Badge className="bg-red-100 text-red-700 text-xs">封禁</Badge>
          <span className="text-sm font-medium text-stone-700">{roleStats.banned}</span>
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
            {filtered.map(u => (
              <UserCard
                key={u.id}
                u={u}
                bannedEmails={bannedEmails}
                onBanToggle={handleBanToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Note */}
      <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-400">
        💡 點擊角色按鈕即可切換角色；點擊「封禁」可封鎖該帳號的所有已知裝置。
      </div>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmBan} onOpenChange={() => setConfirmBan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${confirmBan?.action === 'ban' ? 'text-red-700' : 'text-green-700'}`}>
              {confirmBan?.action === 'ban'
                ? <><ShieldBan className="w-5 h-5" />確認封禁帳號</>
                : <><ShieldCheck className="w-5 h-5" />確認解除封禁</>
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-stone-600">
              {confirmBan?.action === 'ban'
                ? `封禁後，此帳號相關的所有裝置將無法存取平台。`
                : `解除封禁後，此帳號相關的裝置將恢復正常存取。`
              }
            </p>
            <div className="bg-stone-50 rounded-lg px-3 py-2 text-sm font-medium text-stone-700">
              {confirmBan?.user?.full_name || confirmBan?.user?.email}
              <p className="text-xs text-stone-400 font-normal">{confirmBan?.user?.email}</p>
            </div>
            {confirmBan?.action === 'ban' && (
              <div>
                <label className="text-xs text-stone-600 font-medium">封禁原因（選填）</label>
                <Input
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                  placeholder="輸入封禁原因..."
                  className="mt-1 text-sm"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBan(null)}>取消</Button>
            <Button
              className={confirmBan?.action === 'ban' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              onClick={executeBan}
              disabled={processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmBan?.action === 'ban' ? '確認封禁' : '確認解封'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}