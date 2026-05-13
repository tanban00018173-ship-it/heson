import React from 'react';
import { Crown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function VendorMembers({ vendor, user }) {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['vendor_members', vendor.id],
    queryFn: () => base44.entities.VendorMember.filter({ vendor_id: vendor.id, status: 'approved' }),
  });

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-stone-300 text-sm">載入中...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="text-xs font-semibold text-stone-400 mb-3">成員（{members.length}）</p>
      <div className="space-y-2">
        {members.map(m => {
          const isVendorAdmin = m.user_id === vendor.admin_id;
          const isMe = m.user_id === user?.id;
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 bg-stone-50 rounded-xl border border-stone-100">
              <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{(m.user_name || '?')[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-stone-800 truncate">{m.user_name}</p>
                  {isVendorAdmin && <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-stone-400">
                  {isVendorAdmin ? '管理員' : '成員'}{isMe ? '・我' : ''}
                </p>
              </div>
            </div>
          );
        })}
        {members.length === 0 && (
          <p className="text-center text-stone-300 text-sm py-8">尚無已加入成員</p>
        )}
      </div>
    </div>
  );
}