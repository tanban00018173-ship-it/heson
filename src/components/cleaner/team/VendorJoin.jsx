import React, { useState } from 'react';
import { ArrowLeft, Search, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function VendorJoin({ user, onBack }) {
  const [tab, setTab] = useState('join'); // 'join' | 'create'
  const [code, setCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [msg, setMsg] = useState(null);
  const qc = useQueryClient();

  // 已申請或已加入的廠商
  const { data: myMembers = [] } = useQuery({
    queryKey: ['vendor_members_mine', user?.id],
    queryFn: () => base44.entities.VendorMember.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const vendors = await base44.entities.Vendor.filter({ code: code.trim() });
      if (!vendors.length) throw new Error('找不到此代碼對應的廠商');
      const vendor = vendors[0];
      const already = myMembers.find(m => m.vendor_id === vendor.id);
      if (already) throw new Error('您已申請或加入此廠商');
      await base44.entities.VendorMember.create({
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        user_id: user.id,
        user_name: user.full_name || user.email,
        status: 'pending',
      });
      return vendor.name;
    },
    onSuccess: (name) => {
      setMsg({ type: 'ok', text: `已送出申請加入「${name}」，等待管理員審核` });
      setCode('');
      qc.invalidateQueries(['vendor_members_mine']);
    },
    onError: (e) => setMsg({ type: 'err', text: e.message }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newName.trim() || !newCode.trim()) throw new Error('請填寫廠商名稱與代碼');
      const existing = await base44.entities.Vendor.filter({ code: newCode.trim() });
      if (existing.length) throw new Error('此代碼已被使用，請換一個');
      const vendor = await base44.entities.Vendor.create({
        name: newName.trim(),
        code: newCode.trim(),
        description: newDesc.trim(),
        admin_id: user.id,
        admin_name: user.full_name || user.email,
      });
      // 創建者自動加入且已審核
      await base44.entities.VendorMember.create({
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        user_id: user.id,
        user_name: user.full_name || user.email,
        status: 'approved',
      });
      return vendor.name;
    },
    onSuccess: (name) => {
      setMsg({ type: 'ok', text: `廠商「${name}」建立成功！` });
      setNewName(''); setNewCode(''); setNewDesc('');
      qc.invalidateQueries(['vendor_members_mine']);
      qc.invalidateQueries(['my_approved_vendors']);
      setTimeout(onBack, 1200);
    },
    onError: (e) => setMsg({ type: 'err', text: e.message }),
  });

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="bg-black px-5 pt-8 pb-5 text-white flex items-center gap-3">
        <button onClick={onBack}><ArrowLeft className="w-5 h-5 text-white/60" /></button>
        <span className="font-bold text-lg">廠商群聊</span>
      </div>

      {/* 切換 */}
      <div className="flex mx-4 mt-4 rounded-xl overflow-hidden border border-stone-200">
        {[{ key: 'join', label: '加入廠商' }, { key: 'create', label: '註冊廠商' }].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setMsg(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tab === t.key ? 'bg-black text-white' : 'bg-white text-stone-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.type === 'ok' ? 'bg-stone-50 text-stone-700 border border-stone-200' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {msg.text}
          </div>
        )}

        {tab === 'join' && (
          <div className="space-y-4">
            <p className="text-xs text-stone-400">輸入廠商管理員提供的代碼，申請加入廠商群聊</p>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="輸入廠商代碼..."
                className="flex-1 bg-stone-100 rounded-xl px-4 py-3 text-sm outline-none"
              />
              <button
                onClick={() => joinMutation.mutate()}
                disabled={!code.trim() || joinMutation.isPending}
                className="px-5 py-3 bg-black text-white rounded-xl text-sm font-semibold disabled:opacity-40">
                <Search className="w-4 h-4" />
              </button>
            </div>

            {myMembers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-400 mb-2">我的申請紀錄</p>
                {myMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3 bg-stone-50 rounded-xl border border-stone-100 mb-2">
                    <span className="text-sm text-stone-700">{m.vendor_name}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      m.status === 'approved' ? 'bg-black text-white' :
                      m.status === 'rejected' ? 'bg-red-100 text-red-500' :
                      'bg-stone-200 text-stone-500'
                    }`}>
                      {m.status === 'approved' ? '已加入' : m.status === 'rejected' ? '已拒絕' : '審核中'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'create' && (
          <div className="space-y-3">
            <p className="text-xs text-stone-400">建立廠商群聊，系統會產生一組代碼供成員加入</p>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="廠商名稱（必填）"
              className="w-full bg-stone-100 rounded-xl px-4 py-3 text-sm outline-none"
            />
            <input
              value={newCode}
              onChange={e => setNewCode(e.target.value.replace(/\s/g, ''))}
              placeholder="自訂代碼（英數字，必填）"
              className="w-full bg-stone-100 rounded-xl px-4 py-3 text-sm outline-none"
            />
            <input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="廠商描述（選填）"
              className="w-full bg-stone-100 rounded-xl px-4 py-3 text-sm outline-none"
            />
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || !newCode.trim() || createMutation.isPending}
              className="w-full py-3 bg-black text-white rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> 建立廠商
            </button>
          </div>
        )}
      </div>
    </div>
  );
}