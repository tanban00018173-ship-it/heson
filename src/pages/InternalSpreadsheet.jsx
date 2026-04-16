import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Bot, Send, Edit2, Check, X, Download, RefreshCw, Table, Search, Loader2, ShieldCheck, ZoomIn, ZoomOut, Monitor, ArrowLeft, Plus, Trash2, Menu, EyeOff, Eye, Copy, Undo2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import RoleManager from "@/components/internal/RoleManager";
import DeviceManager from "@/components/internal/DeviceManager";

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
function AIChat({ bookings, onMutation }) {
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

      // If AI returned mutations, apply them and record for undo
      if (data.mutations && data.mutations.length > 0) {
        const undoItems = [];
        for (const m of data.mutations) {
          // Find old data for undo
          const oldBooking = bookings.find(b => b.id === m.id);
          if (oldBooking) {
            const oldFields = {};
            Object.keys(m.fields).forEach(k => { oldFields[k] = oldBooking[k]; });
            undoItems.push({ id: m.id, oldFields, newFields: m.fields });
          }
          await base44.entities.Booking.update(m.id, m.fields);
        }
        // Record batch undo
        if (undoItems.length > 0 && onMutation) {
          onMutation({ type: 'ai', items: undoItems, description: `AI 修改 ${undoItems.length} 筆資料` });
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
   const navigate = useNavigate();
   const [user, setUser] = useState(null);
   const [authChecked, setAuthChecked] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');
   const [activeTab, setActiveTab] = useState('sheet'); // 'sheet' | 'ai' | 'roles' | 'devices'
   const [activeSpreadsheet, setActiveSpreadsheet] = useState('booking'); // 'booking' or custom name
   const [spreadsheets, setSpreadsheets] = useState([
     { id: 'booking', name: '清潔訂單' }
   ]);
   const [zoom, setZoom] = useState(1);
   const [newSheetName, setNewSheetName] = useState('');
   const [showNewSheetInput, setShowNewSheetInput] = useState(false);
   const [editingSheetId, setEditingSheetId] = useState(null);
   const [editingSheetName, setEditingSheetName] = useState('');
   const [hiddenSheets, setHiddenSheets] = useState([]);
   const [longPressMenu, setLongPressMenu] = useState(null); // { id, x, y }
   const [sheetContextMenu, setSheetContextMenu] = useState(null); // { id, x, y }
   const [renameDialogSheet, setRenameDialogSheet] = useState(null);
   const [renameValue, setRenameValue] = useState('');
   const longPressTimerRef = useRef(null);
   const tableWrapperRef = useRef(null);
   const queryClient = useQueryClient();
   const [undoStack, setUndoStack] = useState([]); // Undo history
   const [undoing, setUndoing] = useState(false);

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

  // Record a change for undo
  const recordUndo = (item) => {
    setUndoStack(prev => [...prev.slice(-49), item]); // Keep last 50 items
  };

  // Undo last action
  const handleUndo = async () => {
    if (undoStack.length === 0 || undoing) return;
    setUndoing(true);
    const lastAction = undoStack[undoStack.length - 1];
    try {
      if (lastAction.type === 'single') {
        await base44.entities.Booking.update(lastAction.id, lastAction.oldFields);
      } else if (lastAction.type === 'ai') {
        for (const item of lastAction.items) {
          await base44.entities.Booking.update(item.id, item.oldFields);
        }
      } else if (lastAction.type === 'sheet_add') {
        setSpreadsheets(prev => prev.filter(s => s.id !== lastAction.id));
        if (activeSpreadsheet === lastAction.id) {
          const first = spreadsheets.find(s => s.id !== lastAction.id);
          setActiveSpreadsheet(first?.id);
        }
      } else if (lastAction.type === 'sheet_delete') {
        const updated = [...spreadsheets, lastAction.sheet];
        setSpreadsheets(updated);
        if (lastAction.wasHidden) {
          setHiddenSheets(prev => [...prev, lastAction.id]);
        }
      } else if (lastAction.type === 'sheet_rename') {
        setSpreadsheets(prev => prev.map(s => 
          s.id === lastAction.id ? { ...s, name: lastAction.oldName } : s
        ));
      } else if (lastAction.type === 'sheet_hide') {
        setHiddenSheets(prev => prev.filter(h => h !== lastAction.id));
      } else if (lastAction.type === 'sheet_unhide') {
        setHiddenSheets(prev => [...prev, lastAction.id]);
      }
      queryClient.invalidateQueries({ queryKey: ['spreadsheetBookings'] });
      setUndoStack(prev => prev.slice(0, -1));
    } catch (err) {
      console.error('Undo failed:', err);
    }
    setUndoing(false);
  };

  // Update cell with undo support
  const handleCellUpdate = (booking, field, newValue) => {
    const oldValue = booking[field];
    if (oldValue === newValue) return;
    recordUndo({
      type: 'single',
      id: booking.id,
      oldFields: { [field]: oldValue },
      newFields: { [field]: newValue },
      description: `修改 ${booking.client_name || '資料'} 的${COLUMNS.find(c => c.key === field)?.label || field}`
    });
    updateMutation.mutate({ id: booking.id, fields: { [field]: newValue } });
  };

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
    const currentSheet = spreadsheets.find(s => s.id === activeSpreadsheet);
    a.download = `${currentSheet?.name || '試算表'}_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addSpreadsheet = () => {
    if (!newSheetName.trim()) return;
    const newId = 'sheet_' + Date.now();
    setSpreadsheets([...spreadsheets, { id: newId, name: newSheetName }]);
    setActiveSpreadsheet(newId);
    recordUndo({
      type: 'sheet_add',
      id: newId,
      description: `新增試算表「${newSheetName}」`
    });
    setNewSheetName('');
    setShowNewSheetInput(false);
  };

  const removeSpreadsheet = (id) => {
    if (spreadsheets.length <= 1) return;
    const sheet = spreadsheets.find(s => s.id === id);
    if (!sheet) return;
    const updated = spreadsheets.filter(s => s.id !== id);
    const wasHidden = hiddenSheets.includes(id);
    setSpreadsheets(updated);
    if (wasHidden) {
      setHiddenSheets(prev => prev.filter(h => h !== id));
    }
    const newActive = activeSpreadsheet === id ? updated[0]?.id : activeSpreadsheet;
    if (activeSpreadsheet === id) {
      setActiveSpreadsheet(newActive);
    }
    recordUndo({
      type: 'sheet_delete',
      id,
      sheet,
      wasHidden,
      description: `刪除試算表「${sheet.name}」`
    });
  };

  const startEditingSheet = (id, name) => {
    setEditingSheetId(id);
    setEditingSheetName(name);
  };

  const saveEditingSheet = () => {
    if (!editingSheetName.trim()) return;
    const oldName = spreadsheets.find(s => s.id === editingSheetId)?.name;
    setSpreadsheets(spreadsheets.map(s => 
      s.id === editingSheetId ? { ...s, name: editingSheetName } : s
    ));
    recordUndo({
      type: 'sheet_rename',
      id: editingSheetId,
      oldName,
      newName: editingSheetName,
      description: `重新命名試算表為「${editingSheetName}」`
    });
    setEditingSheetId(null);
    setEditingSheetName('');
  };

  const hideSheet = (id) => {
    setHiddenSheets(prev => [...prev, id]);
    setLongPressMenu(null);
    if (activeSpreadsheet === id) {
      const firstVisible = spreadsheets.find(s => s.id !== id && !hiddenSheets.includes(s.id));
      if (firstVisible) setActiveSpreadsheet(firstVisible.id);
    }
    recordUndo({
      type: 'sheet_hide',
      id,
      description: `隱藏試算表「${spreadsheets.find(s => s.id === id)?.name}」`
    });
  };

  const unhideSheet = (id) => {
    setHiddenSheets(prev => prev.filter(h => h !== id));
    setActiveSpreadsheet(id);
    recordUndo({
      type: 'sheet_unhide',
      id,
      description: `恢復試算表「${spreadsheets.find(s => s.id === id)?.name}」`
    });
  };

  const handleLongPressStart = (e, sheetId) => {
    if (activeSpreadsheet !== sheetId) return;
    const visibleCount = spreadsheets.filter(s => !hiddenSheets.includes(s.id)).length;
    if (visibleCount <= 1) return;
    longPressTimerRef.current = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      setLongPressMenu({ id: sheetId, x: rect.left, y: rect.bottom + 4 });
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const visibleSheets = spreadsheets.filter(s => !hiddenSheets.includes(s.id));
  const hiddenSheetsList = spreadsheets.filter(s => hiddenSheets.includes(s.id));

  const copySheet = (id) => {
    const sheet = spreadsheets.find(s => s.id === id);
    if (!sheet) return;
    const newId = 'sheet_' + Date.now();
    const newName = sheet.name + ' (複製)';
    setSpreadsheets([...spreadsheets, { id: newId, name: newName }]);
    recordUndo({
      type: 'sheet_add',
      id: newId,
      description: `複製試算表為「${newName}」`
    });
    setSheetContextMenu(null);
  };

  const openRenameDialog = (id) => {
    const sheet = spreadsheets.find(s => s.id === id);
    if (!sheet) return;
    setRenameDialogSheet(sheet);
    setRenameValue(sheet.name);
    setSheetContextMenu(null);
  };

  const saveRename = () => {
    if (!renameValue.trim()) return;
    setSpreadsheets(spreadsheets.map(s =>
      s.id === renameDialogSheet.id ? { ...s, name: renameValue } : s
    ));
    setRenameDialogSheet(null);
    setRenameValue('');
  };

  const currentSheet = spreadsheets.find(s => s.id === activeSpreadsheet);

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
           <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0 h-8 w-8">
             <ArrowLeft className="w-4 h-4" />
           </Button>
           <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
             <Table className="w-4 h-4 text-amber-600" />
           </div>
           <div className="min-w-0">
             <h1 className="font-semibold text-stone-800 text-sm">內部試算表</h1>
             <p className="text-xs text-stone-400">{currentSheet?.name || '試算表'} · 共 {bookings.length} 筆</p>
           </div>
         </div>
         <div className="flex items-center gap-1 flex-shrink-0">
           <Button
             variant="outline"
             size="sm"
             onClick={handleUndo}
             disabled={undoStack.length === 0 || undoing}
             className="gap-1 text-xs px-2"
             title={undoStack.length > 0 ? `復原: ${undoStack[undoStack.length - 1]?.description || '上一步'}` : '沒有可復原的操作'}
           >
             <Undo2 className="w-3 h-3" />
             <span className="hidden sm:inline">復原</span>
             {undoStack.length > 0 && (
               <Badge className="ml-1 h-4 px-1 text-[10px] bg-amber-100 text-amber-700">{undoStack.length}</Badge>
             )}
           </Button>
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
          { id: 'devices', icon: Monitor, label: '裝置封禁' },
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

      {/* Spreadsheet tabs (only show in sheet tab) */}
      {activeTab === 'sheet' && (
        <div className="bg-stone-50 border-b border-stone-200 px-2 py-2 flex items-center gap-0 flex-shrink-0 relative">
          {/* Hamburger menu — restore hidden sheets */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-200 text-stone-500 transition-colors relative">
                <Menu className="w-4 h-4" />
                {hiddenSheetsList.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {hiddenSheetsList.length}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              {/* Hide current sheet action */}
              {visibleSheets.length > 1 && (
                <>
                  <button
                    onClick={() => hideSheet(activeSpreadsheet)}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-stone-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>隱藏目前試算表</span>
                  </button>
                </>
              )}
              {/* Delete current sheet action */}
              {spreadsheets.length > 1 && (
                <>
                  <button
                    onClick={() => removeSpreadsheet(activeSpreadsheet)}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-stone-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>刪除試算表</span>
                  </button>
                </>
              )}
              {(visibleSheets.length > 1 || activeSpreadsheet !== 'booking') && hiddenSheetsList.length > 0 && (
                <div className="border-t border-stone-100 my-1" />
              )}
              <p className="text-xs font-medium text-stone-500 px-2 py-1.5">隱藏的試算表</p>
              {hiddenSheetsList.length === 0 ? (
                <p className="text-xs text-stone-400 px-2 py-3 text-center">沒有隱藏的試算表</p>
              ) : (
                <div className="space-y-1">
                  {hiddenSheetsList.map(sheet => (
                    <button
                      key={sheet.id}
                      onClick={() => unhideSheet(sheet.id)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-stone-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{sheet.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Scrollable sheet tabs */}
          <div className="flex-1 overflow-x-auto flex items-center gap-2 px-2 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
            {visibleSheets.map((sheet) => (
              <div key={sheet.id} className="flex items-center gap-1 flex-shrink-0">
                {editingSheetId === sheet.id ? (
                  <>
                    <Input
                      value={editingSheetName}
                      onChange={e => setEditingSheetName(e.target.value)}
                      className="h-7 text-xs px-2 py-0 w-32"
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEditingSheet();
                        if (e.key === 'Escape') setEditingSheetId(null);
                      }}
                      autoFocus
                    />
                    <Button
                      onClick={saveEditingSheet}
                      disabled={!editingSheetName.trim()}
                      size="icon"
                      className="h-7 w-7 bg-green-500 hover:bg-green-600 flex-shrink-0"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => setEditingSheetId(null)}
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        if (activeSpreadsheet === sheet.id) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setSheetContextMenu({ id: sheet.id, x: rect.left, y: rect.bottom + 4 });
                        } else {
                          setActiveSpreadsheet(sheet.id);
                        }
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors select-none ${
                        activeSpreadsheet === sheet.id
                          ? 'bg-white border border-amber-500 text-amber-600'
                          : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {sheet.name}
                    </button>

                  </>
                )}
              </div>
            ))}

            {/* Add new sheet */}
            <div className="flex items-center gap-1 ml-1 pl-2 border-l border-stone-200 flex-shrink-0">
              {showNewSheetInput && (
                <>
                  <Input
                    value={newSheetName}
                    onChange={e => setNewSheetName(e.target.value)}
                    placeholder="新試算表..."
                    className="h-7 text-xs px-2 py-0 w-32"
                    onKeyDown={e => {
                      if (e.key === 'Enter') addSpreadsheet();
                      if (e.key === 'Escape') setShowNewSheetInput(false);
                    }}
                    autoFocus
                  />
                  <Button
                    onClick={addSpreadsheet}
                    disabled={!newSheetName.trim()}
                    size="icon"
                    className="h-7 w-7 bg-amber-500 hover:bg-amber-600 flex-shrink-0"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => {
                      setShowNewSheetInput(false);
                      setNewSheetName('');
                    }}
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </>
              )}
              {!showNewSheetInput && (
                <Button
                  onClick={() => setShowNewSheetInput(true)}
                  size="icon"
                  className="h-7 w-7 bg-amber-500 hover:bg-amber-600 flex-shrink-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Long press context menu */}
          {longPressMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setLongPressMenu(null)} />
              <div
                className="fixed z-50 bg-white border border-stone-200 rounded-lg shadow-lg py-1 min-w-[140px]"
                style={{ left: longPressMenu.x, top: longPressMenu.y }}
              >
                <button
                  onClick={() => hideSheet(longPressMenu.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  隱藏此試算表
                </button>
              </div>
            </>
          )}

          {/* Sheet context menu */}
          {sheetContextMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSheetContextMenu(null)} />
              <div
                className="fixed z-50 bg-white border border-stone-200 rounded-lg shadow-lg py-1 min-w-[140px]"
                style={{ left: sheetContextMenu.x, top: sheetContextMenu.y }}
              >
                <button
                  onClick={() => copySheet(sheetContextMenu.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  複製試算表
                </button>
                <button
                  onClick={() => openRenameDialog(sheetContextMenu.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  重新命名
                </button>
                <button
                  onClick={() => { hideSheet(sheetContextMenu.id); setSheetContextMenu(null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors border-t border-stone-100"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  隱藏試算表
                </button>
                {spreadsheets.length > 1 && (
                  <button
                    onClick={() => { removeSpreadsheet(sheetContextMenu.id); setSheetContextMenu(null); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    刪除試算表
                  </button>
                )}
              </div>
            </>
          )}

          {/* Rename dialog */}
          <Dialog open={!!renameDialogSheet} onOpenChange={() => setRenameDialogSheet(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>重新命名試算表</DialogTitle>
              </DialogHeader>
              <Input
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                placeholder="輸入新名稱..."
                className="mt-3"
                onKeyDown={e => {
                  if (e.key === 'Enter') saveRename();
                  if (e.key === 'Escape') setRenameDialogSheet(null);
                }}
                autoFocus
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setRenameDialogSheet(null)}>取消</Button>
                <Button onClick={saveRename} disabled={!renameValue.trim()}>保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

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
                                  onSave={val => handleCellUpdate(booking, col.key, val)}
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
            <AIChat bookings={bookings} onMutation={recordUndo} />
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <RoleManager />
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <DeviceManager />
          </div>
        )}
      </div>
    </div>
  );
}