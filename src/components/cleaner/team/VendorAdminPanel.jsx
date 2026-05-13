import React from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Users, Copy, Check, Crown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';

export default function VendorAdminPanel({ vendor, user, onBack }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ['vendor_members_admin', vendor.id],
    queryFn: () => base44.entities.VendorMember.filter({ vendor_id: vendor.id }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ memberId, status }) => base44.entities.VendorMember.update(memberId, { status }),
    onSuccess: () => qc.invalidateQueries(['vendor_members_admin', vendor.id]),
  });

  const removeMember = useMutation({
    mutationFn: (memberId) => base44.entities.VendorMember.delete(memberId),
    onSuccess: () => qc.invalidateQueries(['vendor_members_admin', vendor.id]),
  });

  const pending = members.filter(m => m.status === 'pending');
  const approved = members.filter(m => m.status === 'approved' && m.user_id !== vendor.admin_id);

  const copyCode = () => {
    navigator.clipboard.writeText(vendor.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="bg-black px-5 pt-8 pb-5 text-white flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack}><ArrowLeft className="w-5 h-5 text-white/60" /></button>
        <span className="font-bold text-lg">{vendor.name} · 管理</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 廠商代碼 */}
        <div className="bg-stone-50 border border-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-400 mb-1">廠商加入代碼</p>
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-stone-800 tracking-widest font-mono">{vendor.code}</p>
            <button onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium">
              {copied ? <><Check className="w-3.5 h-3.5" />已複製</> : <><Copy className="w-3.5 h-3.5" />複製</>}
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-1.5">分享此代碼給成員申請加入</p>
        </div>

        {/* 待審核 */}
        {pending.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2">加入申請（{pending.length}）</p>
            {pending.map(m => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3 bg-white border border-stone-200 rounded-xl mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-stone-400" />
                  </div>
                  <span className="text-sm font-medium text-stone-700">{m.user_name}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateStatus.mutate({ memberId: m.id, status: 'approved' })}
                    className="w-9 h-9 bg-black rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => updateStatus.mutate({ memberId: m.id, status: 'rejected' })}
                    className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-stone-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 已加入成員 */}
        <div>
          <p className="text-xs font-semibold text-stone-500 mb-2">已加入成員（{approved.length}）</p>
          {approved.map(m => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3 bg-stone-50 rounded-xl mb-1.5 border border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center">
                  <span className="text-stone-600 text-sm font-bold">{(m.user_name || '?')[0]}</span>
                </div>
                <span className="text-sm text-stone-700">{m.user_name}</span>
              </div>
              <button
                onClick={() => window.confirm(`確定移除 ${m.user_name}？`) && removeMember.mutate(m.id)}
                className="text-xs text-stone-400 hover:text-red-500 transition-colors px-2 py-1">
                移除
              </button>
            </div>
          ))}
          {approved.length === 0 && <p className="text-xs text-stone-300 text-center py-3">尚無成員</p>}
        </div>
      </div>
    </div>
  );
}