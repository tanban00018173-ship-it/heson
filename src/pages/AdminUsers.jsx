import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Shield, ShieldOff, User, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const ROLE_LABELS = {
  admin: { label: '超級管理員', color: 'bg-red-100 text-red-700' },
  ops:   { label: '營運主管',   color: 'bg-purple-100 text-purple-700' },
  vendor_admin: { label: '廠商主理人', color: 'bg-blue-100 text-blue-700' },
  cleaner: { label: '服務人員', color: 'bg-amber-100 text-amber-700' },
  user:  { label: '一般用戶',   color: 'bg-stone-100 text-stone-600' },
};

export default function AdminUsers() {
  const [selfUser, setSelfUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingRole, setEditingRole] = useState(null);
  const qc = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin') { window.location.href = '/AdminDashboard'; return; }
      setSelfUser(u);
    });
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.functions.invoke('listAllUsers', {}).then(r => r.data?.users || []),
  });

  const { data: banned = [] } = useQuery({
    queryKey: ['bannedDevices'],
    queryFn: () => base44.entities.BannedDevice.filter({ is_active: true }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => base44.functions.invoke('updateUserRole', { userId, role }),
    onSuccess: () => { qc.invalidateQueries(['allUsers']); toast.success('角色已更新'); setEditingRole(null); },
    onError: () => toast.error('更新失敗'),
  });

  const banUserMutation = useMutation({
    mutationFn: async (user) => {
      await base44.entities.BannedDevice.create({
        fingerprint: `user_${user.id}`,
        reason: '管理員手動封禁',
        banned_by: selfUser?.email,
        associated_emails: [user.email],
        is_active: true,
      });
    },
    onSuccess: () => { qc.invalidateQueries(['bannedDevices']); toast.success('用戶已封禁'); },
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId) => {
      const record = banned.find(b => b.fingerprint === `user_${userId}`);
      if (record) await base44.entities.BannedDevice.update(record.id, { is_active: false });
    },
    onSuccess: () => { qc.invalidateQueries(['bannedDevices']); toast.success('已解除封禁'); },
  });

  const bannedIds = new Set(banned.map(b => b.fingerprint.replace('user_', '')));

  const filtered = users.filter(u => {
    const matchSearch = !search || u.full_name?.includes(search) || u.email?.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (!selfUser) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <div className="hidden lg:block"><Sidebar userRole="admin" userName={selfUser?.full_name} /></div>
      <MobileNav userRole="admin" userName={selfUser?.full_name} />

      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-stone-800">人員管理</h1>
            <p className="text-stone-500 mt-1">查詢、設定角色、封禁用戶</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="搜尋姓名或信箱..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-400" />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none">
              <option value="all">全部角色</option>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <th className="text-left px-4 py-3 text-stone-500 font-medium">姓名</th>
                    <th className="text-left px-4 py-3 text-stone-500 font-medium hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-3 text-stone-500 font-medium">角色</th>
                    <th className="text-left px-4 py-3 text-stone-500 font-medium">狀態</th>
                    <th className="text-right px-4 py-3 text-stone-500 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const isBanned = bannedIds.has(u.id);
                    const roleInfo = ROLE_LABELS[u.role] || ROLE_LABELS.user;
                    return (
                      <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={`border-b border-stone-50 hover:bg-stone-50 transition-colors ${isBanned ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-stone-500" />
                            </div>
                            <span className="font-medium text-stone-800">{u.full_name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-stone-500 hidden md:table-cell">{u.email}</td>
                        <td className="px-4 py-3">
                          {editingRole === u.id ? (
                            <div className="flex items-center gap-1">
                              <select
                                defaultValue={u.role}
                                onChange={e => roleMutation.mutate({ userId: u.id, role: e.target.value })}
                                className="text-xs border border-stone-200 rounded-lg px-2 py-1 outline-none bg-white"
                                autoFocus
                              >
                                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                              </select>
                              <button onClick={() => setEditingRole(null)} className="text-stone-400 hover:text-stone-600 text-xs ml-1">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => setEditingRole(u.id)} className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${roleInfo.color} hover:opacity-80 transition-opacity`}>
                              {roleInfo.label} <ChevronDown className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isBanned
                            ? <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-600 font-medium">已封禁</span>
                            : <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-600 font-medium">正常</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          {u.id !== selfUser?.id && (
                            isBanned ? (
                              <button onClick={() => unbanMutation.mutate(u.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 ml-auto">
                                <ShieldOff className="w-3.5 h-3.5" /> 解封
                              </button>
                            ) : (
                              <button onClick={() => { if (window.confirm(`確定封禁 ${u.full_name || u.email}？`)) banUserMutation.mutate(u); }}
                                className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 ml-auto">
                                <Shield className="w-3.5 h-3.5" /> 封禁
                              </button>
                            )
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-stone-400">無符合條件的用戶</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}