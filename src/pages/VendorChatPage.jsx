import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import VendorChat from '@/components/cleaner/team/VendorChat';

export default function VendorChatPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  // 找出該用戶所屬的廠商（已審核通過）
  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['vendor_memberships', user?.id],
    queryFn: () => base44.entities.VendorMember.filter({ user_id: user.id, status: 'approved' }),
    enabled: !!user,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors_for_chat', memberships.map(m => m.vendor_id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        memberships.map(m => base44.entities.Vendor.filter({ id: m.vendor_id }))
      );
      return results.flat();
    },
    enabled: memberships.length > 0,
  });

  const vendor = vendors[0]; // 取第一個廠商

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 bg-white sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-stone-600" />
        </button>
        <div>
          <p className="font-semibold text-sm text-stone-900">{vendor?.name || '中台聊天室'}</p>
          <p className="text-xs text-stone-400">廠商/工作人員內部頻道</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isLoading || !user ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
          </div>
        ) : !vendor ? (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400 gap-2 px-6 text-center">
            <p className="text-sm font-medium">尚未加入任何廠商</p>
            <p className="text-xs text-stone-300">請聯繫管理員將您加入廠商後即可使用此功能</p>
          </div>
        ) : (
          <VendorChat vendor={vendor} user={user} embedded={true} />
        )}
      </div>
    </div>
  );
}