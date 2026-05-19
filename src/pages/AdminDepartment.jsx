import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import AdminBottomNav from '@/components/dashboard/AdminBottomNav.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Users, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const DEPT_ANNOUNCEMENTS = [
  { id: 1, title: '五月全勤獎勵辦法', body: '連續出勤 20 天可獲得 $500 獎金，截止日期 5/31。', time: '2026-05-15', urgent: false },
  { id: 2, title: '⚠️ 系統維護通知', body: '本週六凌晨 0:00 – 2:00 暫停服務，請提前告知客戶。', time: '2026-05-18', urgent: true },
];

const DEPT_TASKS = [
  { id: 1, title: '更新 5 月排班表', assignee: '全體成員', deadline: '2026-05-25', done: false },
  { id: 2, title: '審核新進管理師申請 3 件', assignee: '管理員', deadline: '2026-05-22', done: false },
  { id: 3, title: '整理 4 月財務報表', assignee: '操作者', deadline: '2026-05-20', done: true },
];

function AnnouncementCard({ a }) {
  return (
    <div className={`rounded-2xl p-4 border ${a.urgent ? 'border-red-200 bg-red-50' : 'border-stone-100 bg-stone-50'}`}>
      <div className="flex items-start gap-2">
        <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${a.urgent ? 'text-red-500' : 'text-stone-400'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${a.urgent ? 'text-red-700' : 'text-stone-800'}`}>{a.title}</p>
          <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{a.body}</p>
          <p className="text-[10px] text-stone-400 mt-1">{a.time}</p>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ t }) {
  const [done, setDone] = useState(t.done);
  return (
    <div className={`rounded-2xl p-4 border flex items-center gap-3 ${done ? 'border-stone-100 bg-stone-50 opacity-60' : 'border-stone-200 bg-white'}`}>
      <button onClick={() => setDone(d => !d)}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
          ${done ? 'bg-green-500 border-green-500' : 'border-stone-300'}`}>
        {done && <span className="text-white text-[10px]">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'line-through text-stone-400' : 'text-stone-800'}`}>{t.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-stone-400">{t.assignee}</span>
          <span className="text-stone-200">·</span>
          <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />{t.deadline}
          </span>
        </div>
      </div>
    </div>
  );
}

function GroupChat({ user }) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const DEPT_CHANNEL = 'admin_dept';

  const { data: messages = [] } = useQuery({
    queryKey: ['deptChat'],
    queryFn: () => base44.entities.VendorMessage.filter({ vendor_id: DEPT_CHANNEL }),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (text) => base44.entities.VendorMessage.create({
      vendor_id: DEPT_CHANNEL,
      sender_id: user.id,
      sender_name: user.full_name,
      text,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deptChat'] }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMutation.mutate(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-stone-400 text-sm text-center pt-8">群組尚無訊息，傳送第一則吧！</p>
        )}
        {messages.map(m => {
          const isMine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              {!isMine && (
                <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-[11px] font-bold text-stone-600 mr-2 flex-shrink-0 mt-1">
                  {m.sender_name?.[0] || '?'}
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMine ? 'bg-stone-900 text-white rounded-br-sm' : 'bg-stone-100 text-stone-800 rounded-bl-sm'}`}>
                {!isMine && <p className="text-[10px] font-semibold text-stone-400 mb-0.5">{m.sender_name}</p>}
                <p className="text-sm leading-relaxed">{m.text}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-white/40' : 'text-stone-400'}`}>
                  {m.created_date ? format(new Date(m.created_date), 'HH:mm') : ''}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 pb-3 pt-2 border-t border-stone-100 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="輸入訊息..."
          className="flex-1 bg-stone-100 rounded-xl px-4 py-2.5 text-sm outline-none text-stone-800 placeholder:text-stone-400" />
        <button onClick={handleSend}
          className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-stone-700 transition-colors">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

export default function AdminDepartment() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) { base44.auth.redirectToLogin(); return; }
      base44.auth.me().then(setUser);
    });
  }, []);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-stone-900 pt-10 pb-5 px-4 text-white">
        <p className="text-xs text-white/40 mb-1">內部協作</p>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-white/80" />
          <p className="text-xl font-bold">部門</p>
        </div>
      </div>

      <div className="flex border-b border-stone-100 px-4 pt-2">
        {[['overview', '總覽'], ['chat', '群聊']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`mr-4 pb-2 text-sm font-medium border-b-2 transition-colors
              ${tab === key ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="flex-1 overflow-y-auto pb-28 px-4 pt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">部門公告</p>
            <div className="space-y-2">
              {DEPT_ANNOUNCEMENTS.map(a => <AnnouncementCard key={a.id} a={a} />)}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">部門任務</p>
            <div className="space-y-2">
              {DEPT_TASKS.map(t => <TaskCard key={t.id} t={t} />)}
            </div>
          </div>
        </div>
      )}

      {tab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden pb-16">
          <GroupChat user={user} />
        </div>
      )}

      <AdminBottomNav />
    </div>
  );
}