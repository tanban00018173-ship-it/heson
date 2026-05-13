import React from 'react';
import { CheckCircle2, XCircle, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function VendorAdmin({ vendor }) {
  const qc = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ['vendor_members_admin', vendor.id],
    queryFn: () => base44.entities.VendorMember.filter({ vendor_id: vendor.id }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ memberId, status }) => base44.entities.VendorMember.update(memberId, { status }),
    onSuccess: () => qc.invalidateQueries(['vendor_members_admin', vendor.id]),
  });

  const pending = members.filter(m => m.status === 'pending');
  const approved = members.filter(m => m.status === 'approved');

  return (
    <div className="p-4 space-y-4">
      <div className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
        <p className="text-xs text-stone-400">廠商代碼</p>
        <p className="text-lg font-bold text-stone-800 tracking-widest mt-0.5">{vendor.code}</p>
        <p className="text-xs text-stone-400 mt-0.5">分享此代碼給成員申請加入</p>
      </div>

      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-500 mb-2">待審核（{pending.length}）</p>
          {pending.map(m => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3 bg-white border border-stone-100 rounded-xl mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-stone-400" />
                </div>
                <span className="text-sm text-stone-700">{m.user_name}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateStatus.mutate({ memberId: m.id, status: 'approved' })}
                  className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => updateStatus.mutate({ memberId: m.id, status: 'rejected' })}
                  className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-stone-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-stone-500 mb-2">已加入成員（{approved.length}）</p>
        {approved.map(m => (
          <div key={m.id} className="flex items-center gap-2 px-4 py-3 bg-stone-50 rounded-xl mb-1.5">
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
              <Users className="w-4 h-4 text-stone-500" />
            </div>
            <span className="text-sm text-stone-700">{m.user_name}</span>
          </div>
        ))}
        {approved.length === 0 && <p className="text-xs text-stone-300 text-center py-2">尚無成員</p>}
      </div>
    </div>
  );
}