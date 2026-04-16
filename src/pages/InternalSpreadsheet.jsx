import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Bot, Send, Edit2, Check, X, Download, RefreshCw, Table, Search, Loader2, ShieldCheck, ZoomIn, ZoomOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RoleManager from "@/components/internal/RoleManager";

// Editable cell component
function EditableCell({ value, onSave, type = 'text' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? '');

  const handleSave = () => {
    onSave(val);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 min-w-[120px]">
        <Input
          value={val}
          onChange={e => setVal(e.target.value)}
          className="h-7 text-xs px-1 py-0"
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
        />
        <button onClick={handleSave} className="text-green-600 hover:text-green-700"><Check className="w-3 h-3" /></button>
        <button onClick={() => setEditing(false)} className="text-red-500 hover:text-red-600"><X className="w-3 h-3" /></button>
      </div>
    );
  }

  return (
    <div
      className="group flex items-center gap-1 cursor-pointer hover:bg-amber-50 rounded px-1 min-h-[24px] min-w-[80px]"
      onClick={() => setEditing(true)}
    >
      <span className="text-xs text-stone-700">{value ?? '-'}</span>
      <Edit2 className="w-3 h-3 text-stone-300 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 flex-shrink-0" />
    </div>
  );
}

// AI Chat
function AIChat({ bookings }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '您好！我是內部 AI 助理。您可以要求我：\n1. **修改試算表資料**（例：「把張三的狀態改成已完成」）\n2. **查詢資料**（例：「列出本週所有待確認的預約」）\n請問有什麼需要協助的？' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await base44.functions.invoke('spreadsheetAI', {
        message: userMsg,
        bookings: bookings
      });
      const data = response.data;

      // If AI returned mutations, apply them
      if (data.mutations && data.mutations.length > 0) {
        for (const m of data.mutations) {
          await base44.entities.Booking.update(m.id, m.fields);
        }
        queryClient.invalidateQueries({ queryKey: ['spreadsheetBookings'] });
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ 發生錯誤，請稍後再試。' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-amber-600" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'user'
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-200 text-stone-700'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0">
              <Bot className="w-4 h-4 text-amber-600" />
            </div>
            <div className="bg-white border border-stone-200 rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 p-3 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="輸入指令或問題..."
          className="text-sm"
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon" className="bg-stone-800 hover:bg-stone-900 flex-shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Spreadsheet columns definition
const COLUMNS = [
  { key: 'client_name', label: '客戶姓名', editable: true },
  { key: 'service_type', label: '服務類型', editable: true },
  { key: 'scheduled_date', label: '預約日期', editable: true },
  { key: 'time_slot', label: '時段', editable: true },
  { key: 'status', label: '狀態', editable: true },
  { key: 'address', label: '地址', editable: true },
  { key: 'cleaner_name', label: '指派管理師', editable: true },
  { key: 'notes', label: '備註', editable: true },
  { key: 'created_date', label: '建立時間', editable: false },
];

export default function InternalSpreadsheet() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('sheet'); // 'sheet' | 'ai'
  const [zoom, setZoom] = useState(1);
  const tableWrapperRef = useRef(null);
  const queryClient = useQueryClient();

  const changeZoom = (delta) => setZoom(z => Math.min(2, Math.max(0.4, +(z + delta).toFixed(1))));

  useEffect(() => {
    const el = tableWrapperRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        changeZoom(e.deltaY < 0 ? 0.1 : -0.1);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [authChecked]);

  useEffect(() => {
    const check = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const me = await base44.auth.me();
      if (me.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(me);
      setAuthChecked(true);
    };
    check();
  }, []);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['spreadsheetBookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 500),
    enabled: authChecked,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fields }) => base44.entities.Booking.update(id, fields),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spreadsheetBookings'] }),
  });

  const filtered = bookings.filter(b => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (b.client_name || '').toLowerCase().includes(q) ||
      (b.service_type || '').toLowerCase().includes(q) ||
      (b.status || '').toLowerCase().includes(q) ||
      (b.address || '').toLowerCase().includes(q) ||
      (b.cleaner_name || '').toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    const header = COLUMNS.map(c => c.label).join(',');
    const rows = filtered.map(b =>
      COLUMNS.map(c => {
        let val = b[c.key] ?? '';
        if (c.key === 'created_date' && val) val = format(new Date(val), 'yyyy/MM/dd HH:mm');
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking_data_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-stone-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Table className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-stone-800 text-sm">內部試算表</h1>
            <p className="text-xs text-stone-400">共 {bookings.length} 筆</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 text-xs px-2">
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">重整</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1 text-xs px-2">
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">匯出 CSV</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-stone-200 px-2 flex gap-0 flex-shrink-0 overflow-x-auto">
        {[
          { id: 'sheet', icon: Table, label: '試算表' },
          { id: 'ai', icon: Bot, label: 'AI 助理' },
          { id: 'roles', icon: ShieldCheck, label: '權限管理' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === id ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        {activeTab === 'sheet' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="px-4 py-3 bg-white border-b border-stone-100 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <Input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="搜尋客戶、服務類型、狀態..."
                  className="pl-8 h-8 text-xs"
                />
              </div>
              {searchTerm && (
                <span className="text-xs text-stone-400">找到 {filtered.length} 筆</span>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <button onClick={() => changeZoom(-0.1)} className="p-1 rounded hover:bg-stone-100 text-stone-500"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-xs text-stone-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => changeZoom(0.1)} className="p-1 rounded hover:bg-stone-100 text-stone-500"><ZoomIn className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Table */}
            <div ref={tableWrapperRef} className="flex-1 overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : (
                <table className="w-full text-xs border-collapse min-w-[1000px]" style={{ transformOrigin: 'top left', transform: `scale(${zoom})`, width: `${100 / zoom}%` }}>
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-stone-100">
                      <th className="text-left px-3 py-2 font-medium text-stone-500 border-b border-r border-stone-200 w-8">#</th>
                      {COLUMNS.map(col => (
                        <th key={col.key} className="text-left px-3 py-2 font-medium text-stone-600 border-b border-r border-stone-200 whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={COLUMNS.length + 1} className="text-center py-12 text-stone-400">
                          {searchTerm ? '找不到符合的資料' : '暫無預約資料'}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((booking, idx) => (
                        <tr key={booking.id} className={`border-b border-stone-100 hover:bg-amber-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}`}>
                          <td className="px-3 py-1.5 text-stone-400 border-r border-stone-100">{idx + 1}</td>
                          {COLUMNS.map(col => (
                            <td key={col.key} className="px-2 py-1 border-r border-stone-100">
                              {col.editable ? (
                                <EditableCell
                                  value={col.key === 'scheduled_date' && booking[col.key]
                                    ? format(new Date(booking[col.key]), 'yyyy/MM/dd')
                                    : booking[col.key]}
                                  onSave={val => updateMutation.mutate({ id: booking.id, fields: { [col.key]: val } })}
                                />
                              ) : (
                                <span className="text-stone-500 px-1">
                                  {col.key === 'created_date' && booking[col.key]
                                    ? format(new Date(booking[col.key]), 'yyyy/MM/dd HH:mm')
                                    : booking[col.key] ?? '-'}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <AIChat bookings={bookings} />
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <RoleManager />
          </div>
        )}
      </div>
    </div>
  );
}