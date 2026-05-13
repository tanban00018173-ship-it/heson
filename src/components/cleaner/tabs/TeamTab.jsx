import React from 'react';
import { MessageCircle, Users, Building2 } from 'lucide-react';

export default function TeamTab() {
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="bg-black p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5" />
          <span className="font-bold text-lg">團隊訊息</span>
        </div>
        <p className="text-white/50 text-sm">聯繫客戶或赫頌廠商</p>
      </div>

      <div className="flex gap-1 px-4 pt-3 pb-1">
        {[{ label: '全部', icon: MessageCircle }, { label: '廠商', icon: Building2 }, { label: '客戶', icon: Users }].map(({ label, icon: Icon }) => (
          <button key={label} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-stone-100 rounded-full text-stone-500">
            <Icon className="w-3 h-3" /> {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-stone-300">
        <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">尚無訊息</p>
        <p className="text-xs mt-1 text-stone-300">聊天室串接後將顯示在此</p>
      </div>
    </div>
  );
}