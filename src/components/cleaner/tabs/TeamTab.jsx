import React, { useState } from 'react';
import { MessageCircle, Users, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ClientChat from '../team/ClientChat';
import VendorJoin from '../team/VendorJoin';
import VendorChat from '../team/VendorChat';

export default function TeamTab({ user }) {
  const [tab, setTab] = useState('chat'); // 'chat' | 'vendor'
  const [selectedVendor, setSelectedVendor] = useState(null);

  // 已加入（approved）的廠商成員記錄
  const { data: approvedMembers = [] } = useQuery({
    queryKey: ['my_approved_vendors', user?.id],
    queryFn: () => base44.entities.VendorMember.filter({ user_id: user?.id, status: 'approved' }),
    enabled: !!user?.id,
  });

  // 取得廠商詳細資料
  const { data: allVendors = [] } = useQuery({
    queryKey: ['all_vendors'],
    queryFn: () => base44.entities.Vendor.list(),
    enabled: approvedMembers.length > 0,
  });

  const myVendors = allVendors.filter(v =>
    approvedMembers.some(m => m.vendor_id === v.id)
  );

  // 進入廠商群聊
  if (selectedVendor) {
    return (
      <VendorChat
        vendor={selectedVendor}
        user={user}
        onBack={() => setSelectedVendor(null)}
      />
    );
  }



  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="bg-black px-5 pt-8 pb-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5" />
          <span className="font-bold text-lg">團隊訊息</span>
        </div>
        <p className="text-white/50 text-sm">客戶訊息與廠商群聊</p>
      </div>

      {/* 主切換 */}
      <div className="flex mx-4 mt-4 rounded-xl overflow-hidden border border-stone-200">
        <button onClick={() => setTab('chat')}
          className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${tab === 'chat' ? 'bg-black text-white' : 'bg-white text-stone-400'}`}>
          <MessageCircle className="w-4 h-4" /> 聊聊
        </button>
        <button onClick={() => setTab('vendor')}
          className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${tab === 'vendor' ? 'bg-black text-white' : 'bg-white text-stone-400'}`}>
          <Building2 className="w-4 h-4" /> 廠商
        </button>
      </div>

      <div className="p-4">
        {tab === 'chat' && <ClientChat />}

        {tab === 'vendor' && (
          <div className="space-y-4">
            {/* 加入/註冊 直接內嵌 */}
            <VendorJoin user={user} onBack={() => {}} inline />

            {/* 已加入的廠商列表 */}
            {myVendors.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-400 mb-2">我的廠商群聊</p>
                {myVendors.map(v => (
                  <button key={v.id} onClick={() => setSelectedVendor(v)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-stone-100 rounded-xl mb-2 hover:bg-stone-50 transition-colors text-left">
                    <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{v.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800">{v.name}</p>
                      {v.description && <p className="text-xs text-stone-400 truncate">{v.description}</p>}
                    </div>
                    <span className="text-stone-300 text-lg">›</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}