import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// embedded=true: 無 header，直接嵌入 VendorHome 的 tab 裡
export default function VendorChat({ vendor, user, embedded = false, onBack }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['vendor_messages', vendor.id],
    queryFn: () => base44.entities.VendorMessage.filter({ vendor_id: vendor.id }, 'created_date', 100),
    refetchInterval: 3000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMsg = useMutation({
    mutationFn: () => base44.entities.VendorMessage.create({
      vendor_id: vendor.id,
      sender_id: user.id,
      sender_name: user.full_name || user.email,
      text: input.trim(),
    }),
    onSuccess: () => {
      setInput('');
      qc.invalidateQueries(['vendor_messages', vendor.id]);
    },
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && <p className="text-xs text-stone-400 mb-1 px-1">{msg.sender_name}</p>}
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                isMe ? 'bg-black text-white rounded-br-sm' : 'bg-white text-stone-800 border border-stone-100 rounded-bl-sm'
              }`}>
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-white/40' : 'text-stone-300'}`}>
                  {new Date(msg.created_date).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="text-center text-stone-300 text-sm mt-8">開始對話吧</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white px-4 py-3 flex items-center gap-2 border-t border-stone-100" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && input.trim() && sendMsg.mutate()}
          placeholder="輸入訊息..."
          className="flex-1 bg-stone-100 rounded-full px-4 py-2 text-sm outline-none"
        />
        <button
          onClick={() => sendMsg.mutate()}
          disabled={!input.trim() || sendMsg.isPending}
          className="w-9 h-9 bg-black rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}