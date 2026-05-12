import React, { useState } from 'react';
import { MessageCircle, Send, ChevronLeft, Users, Phone, Building2 } from 'lucide-react';

const CONTACTS = [
  {
    id: 'heson',
    type: 'company',
    name: '赫頌客服團隊',
    avatar: '🏢',
    lastMsg: '您的問題我們已收到，稍後回覆',
    time: '10:32',
    unread: 1,
    online: true,
  },
  {
    id: 'client_1',
    type: 'client',
    name: '張小姐（台北信義）',
    avatar: '👤',
    lastMsg: '請問可以提前到嗎？',
    time: '昨天',
    unread: 0,
    online: false,
  },
  {
    id: 'client_2',
    type: 'client',
    name: '林先生（新北板橋）',
    avatar: '👤',
    lastMsg: '謝謝你！清得很乾淨！',
    time: '週一',
    unread: 0,
    online: false,
  },
  {
    id: 'vendor',
    type: 'vendor',
    name: '赫頌廠商對接',
    avatar: '🤝',
    lastMsg: '下週排班已更新，請確認',
    time: '週二',
    unread: 2,
    online: true,
  },
];

const MOCK_MESSAGES = {
  heson: [
    { id: 1, from: 'other', text: '您好！有什麼需要幫助的嗎？', time: '10:30' },
    { id: 2, from: 'me', text: '想詢問關於這週排班的問題', time: '10:31' },
    { id: 3, from: 'other', text: '您的問題我們已收到，稍後回覆', time: '10:32' },
  ],
  vendor: [
    { id: 1, from: 'other', text: '下週排班已更新，請確認', time: '週二 14:00' },
    { id: 2, from: 'other', text: '如有問題請儘快回覆', time: '週二 14:01' },
  ],
};

export default function TeamTab() {
  const [activeChat, setActiveChat] = useState(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  const sendMessage = () => {
    if (!inputText.trim() || !activeChat) return;
    const newMsg = { id: Date.now(), from: 'me', text: inputText.trim(), time: '剛剛' };
    setMessages(prev => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMsg]
    }));
    setInputText('');
  };

  if (activeChat) {
    const chatMessages = messages[activeChat.id] || [];
    return (
      <div className="flex-1 flex flex-col bg-stone-50 overflow-hidden">
        {/* Chat Header */}
        <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-stone-100 shadow-sm">
          <button onClick={() => setActiveChat(null)}>
            <ChevronLeft className="w-5 h-5 text-stone-500" />
          </button>
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-xl">
            {activeChat.avatar}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-stone-800">{activeChat.name}</p>
            {activeChat.online && <p className="text-xs text-green-500">● 線上</p>}
          </div>
          <Phone className="w-5 h-5 text-stone-400" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.from === 'me'
                  ? 'bg-amber-500 text-white rounded-br-sm'
                  : 'bg-white text-stone-800 shadow-sm border border-stone-100 rounded-bl-sm'
              }`}>
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.from === 'me' ? 'text-amber-200' : 'text-stone-400'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
          {chatMessages.length === 0 && (
            <div className="text-center text-stone-400 text-sm mt-8">開始對話吧</div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white px-4 py-3 flex items-center gap-2 border-t border-stone-100">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="輸入訊息..."
            className="flex-1 bg-stone-100 rounded-full px-4 py-2 text-sm outline-none"
          />
          <button
            onClick={sendMessage}
            className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5" />
          <span className="font-bold text-lg">團隊訊息</span>
        </div>
        <p className="text-white/80 text-sm">聯繫客戶或赫頌廠商</p>
      </div>

      {/* 分類標籤 */}
      <div className="flex gap-1 px-4 pt-3 pb-1">
        {[
          { label: '全部', icon: MessageCircle },
          { label: '廠商', icon: Building2 },
          { label: '客戶', icon: Users },
        ].map(({ label, icon: Icon }) => (
          <button key={label} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-stone-200 rounded-full text-stone-600">
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* 聯絡人列表 */}
      <div className="p-4 space-y-2">
        {CONTACTS.map(contact => (
          <button
            key={contact.id}
            onClick={() => setActiveChat(contact)}
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-stone-100 text-left"
          >
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
                {contact.avatar}
              </div>
              {contact.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-sm font-semibold text-stone-800">{contact.name}</p>
                <span className="text-xs text-stone-400 flex-shrink-0">{contact.time}</span>
              </div>
              <p className="text-xs text-stone-400 truncate">{contact.lastMsg}</p>
            </div>
            {contact.unread > 0 && (
              <span className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                {contact.unread}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}