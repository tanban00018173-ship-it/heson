import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function ClientChat() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-stone-300">
      <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
      <p className="text-sm">尚無客戶訊息</p>
      <p className="text-xs mt-1 text-stone-300">客戶聊天室串接後將顯示在此</p>
    </div>
  );
}