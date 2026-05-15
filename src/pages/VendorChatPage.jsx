import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Send, MessageSquare, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 產生對話 ID（兩個 user ID 排序後組合）
function makeConvId(uid1, uid2) {
  return [uid1, uid2].sort().join('__');
}

// ─── 個別聊天視窗 ─────────────────────────────────────────────
function ChatWindow({ user, contact }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const qc = useQueryClient();
  const convId = makeConvId(user.id, contact.id);

  const { data: messages = [] } = useQuery({
    queryKey: ['dm', convId],
    queryFn: () => base44.entities.DirectMessage.filter({ conversation_id: convId }, 'created_date', 100),
    refetchInterval: 3000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMsg = useMutation({
    mutationFn: () => base44.entities.DirectMessage.create({
      conversation_id: convId,
      sender_id: user.id,
      sender_name: user.full_name || user.email,
      receiver_id: contact.id,
      text: input.trim(),
    }),
    onSuccess: () => {
      setInput('');
      qc.invalidateQueries({ queryKey: ['dm', convId] });
    },
  });

  return (
    <div className="flex flex-col h-full">
      {/* 聊天訊息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
        {messages.length === 0 && (
          <div className="text-center text-stone-300 text-sm mt-12">開始與 {contact.name} 對話吧</div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === user.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && <p className="text-xs text-stone-400 mb-1 px-1">{msg.sender_name}</p>}
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                isMe ? 'bg-stone-900 text-white rounded-br-sm' : 'bg-white text-stone-800 border border-stone-100 rounded-bl-sm shadow-sm'
              }`}>
                <p className="leading-relaxed">{msg.text}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-white/40' : 'text-stone-300'}`}>
                  {new Date(msg.created_date).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 輸入框 */}
      <div
        className="bg-white px-4 py-3 flex items-center gap-2 border-t border-stone-100"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && input.trim() && sendMsg.mutate()}
          placeholder={`傳訊息給 ${contact.name}...`}
          className="flex-1 bg-stone-100 rounded-full px-4 py-2.5 text-sm outline-none focus:bg-stone-200 transition-colors"
        />
        <button
          onClick={() => sendMsg.mutate()}
          disabled={!input.trim() || sendMsg.isPending}
          className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-stone-700 transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── 主頁面 ───────────────────────────────────────────────────
export default function VendorChatPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  // 找出該用戶已審核通過的廠商成員關係
  const { data: myMemberships = [], isLoading } = useQuery({
    queryKey: ['my_memberships', user?.id],
    queryFn: () => base44.entities.VendorMember.filter({ user_id: user.id, status: 'approved' }),
    enabled: !!user,
  });

  // 找出同廠商的所有成員（配合的人員）
  const vendorIds = myMemberships.map(m => m.vendor_id);

  const { data: allMembers = [] } = useQuery({
    queryKey: ['all_vendor_members', vendorIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        vendorIds.map(vid => base44.entities.VendorMember.filter({ vendor_id: vid, status: 'approved' }))
      );
      return results.flat();
    },
    enabled: vendorIds.length > 0,
  });

  // 找出廠商名稱
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors_info', vendorIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        vendorIds.map(vid => base44.entities.Vendor.filter({ id: vid }))
      );
      return results.flat();
    },
    enabled: vendorIds.length > 0,
  });

  // 找出用戶資料（配合的人員）
  const { data: allUsers = [] } = useQuery({
    queryKey: ['vendor_users_info', allMembers.map(m => m.user_id).join(',')],
    queryFn: async () => {
      const uniqueIds = [...new Set(allMembers.map(m => m.user_id))].filter(id => id !== user.id);
      if (uniqueIds.length === 0) return [];
      const results = await Promise.all(
        uniqueIds.map(uid => base44.entities.User.filter({ id: uid }))
      );
      return results.flat();
    },
    enabled: allMembers.length > 0 && !!user,
  });

  // 聯絡人列表（配合的所有人）
  const contacts = allUsers.map(u => ({
    id: u.id,
    name: u.full_name || u.email,
    email: u.email,
    vendorName: vendors.find(v => {
      const vm = allMembers.find(m => m.user_id === u.id);
      return vm && v.id === vm.vendor_id;
    })?.name || '',
  })).filter(c => {
    if (!search) return true;
    return c.name.includes(search) || c.vendorName.includes(search);
  });

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const showList = !selectedContact || !isMobile;
  const showChat = !!selectedContact;

  return (
    <div className="flex h-screen bg-white overflow-hidden">

      {/* ── 左側聯絡人列表 ── */}
      {(showList) && (
        <div className={`flex flex-col border-r border-stone-100 bg-white ${selectedContact ? 'hidden md:flex md:w-72' : 'w-full md:w-72'}`}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-100">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
            <p className="font-bold text-stone-900">訊息</p>
          </div>

          {/* 搜尋 */}
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 bg-stone-100 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜尋聯絡人..."
                className="flex-1 bg-transparent text-sm outline-none placeholder-stone-400"
              />
            </div>
          </div>

          {/* 聯絡人列表 */}
          <div className="flex-1 overflow-y-auto">
            {isLoading || !user ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-stone-300 gap-2 px-6 text-center">
                <MessageSquare className="w-8 h-8" />
                <p className="text-sm font-medium text-stone-400">目前還沒有對話</p>
                <p className="text-xs">完成預約後，您可以在這裡與服務人員直接聯繫</p>
              </div>
            ) : (
              contacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 transition-colors text-left ${
                    selectedContact?.id === contact.id ? 'bg-stone-100' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0 text-stone-600 font-bold text-sm">
                    {(contact.name[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-stone-900 truncate">{contact.name}</p>
                    {contact.vendorName && (
                      <p className="text-xs text-stone-400 truncate">{contact.vendorName}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── 右側聊天視窗 ── */}
      {showChat ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-100 bg-white flex-shrink-0">
            <button
              onClick={() => setSelectedContact(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors md:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
            <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold text-sm flex-shrink-0">
              {(selectedContact.name[0] || '?').toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm text-stone-900">{selectedContact.name}</p>
              {selectedContact.vendorName && (
                <p className="text-xs text-stone-400">{selectedContact.vendorName}</p>
              )}
            </div>
          </div>

          <ChatWindow user={user} contact={selectedContact} />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-stone-300 flex-col gap-3">
          <MessageSquare className="w-12 h-12" />
          <p className="text-sm font-medium">選擇一位聯絡人開始聊天</p>
        </div>
      )}
    </div>
  );
}