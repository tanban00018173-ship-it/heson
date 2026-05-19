import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import AdminBottomNav from '@/components/dashboard/AdminBottomNav.jsx';
import { ChevronLeft, ChevronRight, Plus, LogIn, LogOut, Megaphone } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const ANNOUNCEMENTS = [
  { id: 1, text: '🎉 五月全勤獎勵公告：連續出勤 20 天可獲得 $500 獎金！', color: 'from-amber-500 to-orange-500' },
  { id: 2, text: '📋 本週五下午 3 點舉行部門例會，請準時出席。', color: 'from-blue-500 to-indigo-500' },
  { id: 3, text: '🛡️ 系統維護通知：週六 0:00 – 2:00 暫停服務。', color: 'from-stone-600 to-stone-800' },
];

function AnnouncementCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(t);
  }, []);
  const a = ANNOUNCEMENTS[idx];
  return (
    <div className={`mx-4 mt-4 rounded-2xl bg-gradient-to-r ${a.color} p-4 text-white shadow-md`}>
      <div className="flex items-start gap-3">
        <Megaphone className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-80" />
        <p className="text-sm font-medium leading-relaxed">{a.text}</p>
      </div>
      <div className="flex justify-center gap-1.5 mt-3">
        {ANNOUNCEMENTS.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
}

const MOCK_EVENTS = {
  '2026-05-12': [{ label: '上班打卡 09:05', type: 'in' }],
  '2026-05-13': [{ label: '上班打卡 08:58', type: 'in' }, { label: '下班打卡 18:02', type: 'out' }],
  '2026-05-19': [{ label: '上班打卡 09:00', type: 'in' }],
};

function MonthCalendar() {
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const startPad = getDay(startOfMonth(current));
  const selectedKey = format(selected, 'yyyy-MM-dd');
  const selectedEvents = MOCK_EVENTS[selectedKey] || [];

  return (
    <div className="mx-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100">
          <ChevronLeft className="w-4 h-4 text-stone-600" />
        </button>
        <p className="text-sm font-semibold text-stone-800">
          {format(current, 'yyyy年 M月', { locale: zhTW })}
        </p>
        <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100">
          <ChevronRight className="w-4 h-4 text-stone-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
          <p key={d} className="text-center text-[11px] font-medium text-stone-400 py-1">{d}</p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const hasEvent = !!MOCK_EVENTS[key];
          const isSel = isSameDay(day, selected);
          const today = isToday(day);
          return (
            <button key={key} onClick={() => setSelected(day)}
              className={`flex flex-col items-center justify-center h-10 rounded-xl transition-all
                ${isSel ? 'bg-stone-900 text-white' : today ? 'border border-stone-900 text-stone-900' : 'hover:bg-stone-100 text-stone-700'}`}>
              <span className="text-sm font-medium">{format(day, 'd')}</span>
              {hasEvent && <span className={`w-1 h-1 rounded-full mt-0.5 ${isSel ? 'bg-white/60' : 'bg-amber-500'}`} />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 bg-stone-50 rounded-2xl p-3 min-h-[80px]">
        <p className="text-xs font-semibold text-stone-400 mb-2">
          {format(selected, 'M/d（EEE）', { locale: zhTW })}
        </p>
        {selectedEvents.length === 0 ? (
          <p className="text-sm text-stone-300 text-center py-3">無行程</p>
        ) : (
          <div className="space-y-2">
            {selectedEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ev.type === 'in' ? 'bg-green-500' : 'bg-stone-400'}`} />
                <span className="text-sm text-stone-700">{ev.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSchedule() {
  const [user, setUser] = useState(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) { base44.auth.redirectToLogin(); return; }
      base44.auth.me().then(setUser);
    });
  }, []);

  const handleClock = () => {
    const now = new Date();
    if (!clockedIn) {
      setClockedIn(true);
      setClockTime(format(now, 'HH:mm'));
    } else {
      setClockedIn(false);
      setClockTime(null);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-stone-900 pt-10 pb-5 px-4 text-white">
        <p className="text-xs text-white/40 mb-1">
          {format(new Date(), 'yyyy年 M月 d日 EEEE', { locale: zhTW })}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">{clockedIn ? '已上班' : '尚未打卡'}</p>
            {clockTime && <p className="text-white/60 text-sm">上班時間 {clockTime}</p>}
          </div>
          <button onClick={handleClock}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all shadow-lg
              ${clockedIn ? 'bg-stone-600 text-white hover:bg-stone-500' : 'bg-white text-stone-900 hover:bg-stone-100'}`}>
            {clockedIn ? <><LogOut className="w-4 h-4" />下班打卡</> : <><LogIn className="w-4 h-4" />上班打卡</>}
          </button>
        </div>
      </div>

      <AnnouncementCarousel />

      <div className="flex-1 overflow-y-auto pb-32">
        <MonthCalendar />
      </div>

      <div className="fixed bottom-24 right-4 z-30">
        <button onClick={() => setShowAddModal(true)}
          className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center shadow-xl shadow-stone-900/30 hover:bg-stone-700 transition-colors">
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full bg-white rounded-t-3xl p-6 shadow-2xl">
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
            <p className="text-base font-bold text-stone-800 mb-4">新增行程</p>
            <input type="text" placeholder="行程標題..." value={newEventTitle}
              onChange={e => setNewEventTitle(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-900 mb-4" />
            <input type="date"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-900 mb-4" />
            <button onClick={() => { setShowAddModal(false); setNewEventTitle(''); }}
              className="w-full bg-stone-900 text-white rounded-xl py-3 font-semibold text-sm">
              儲存行程
            </button>
          </div>
        </div>
      )}

      <AdminBottomNav />
    </div>
  );
}