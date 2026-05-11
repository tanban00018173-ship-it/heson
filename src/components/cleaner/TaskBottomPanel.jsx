/**
 * 底部訂單資訊面板 - 可上拉抽屜
 * 三段高度：peek（只顯示 handle）/ half（列表）/ full（全開）
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  Zap, MapPin, Calendar, Clock, FileText,
  CheckCircle2, ExternalLink, Loader2, X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

function openGoogleNavigation(lat, lng, address) {
  const dest = lat && lng ? `${lat},${lng}` : encodeURIComponent(address || '');
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, '_blank');
}

// 高度設定（px 或 vh 字串，供 style 使用）
const SNAP = {
  peek: 56,       // 只露出 handle + 標題列
  half: 260,      // 顯示水平任務列表
  full: '82vh',   // 全開顯示詳情 + 列表
};

// 單一任務詳情卡
function TaskDetailCard({ task, onAccept, accepting, onClose }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden mx-4 mb-3">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-0">{task.service_type}</Badge>
        </div>
        <div className="flex items-center gap-3">
          {task.amount && (
            <span className="text-base font-bold text-green-700">NT$ {task.amount.toLocaleString()}</span>
          )}
          <button onClick={onClose} className="text-stone-300 hover:text-stone-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-stone-700 leading-snug">{task.address || '地址未提供'}</p>
        </div>
        <div className="flex gap-3 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {task.scheduled_date ? format(new Date(task.scheduled_date), 'M/d (EEE)', { locale: zhTW }) : '-'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.time_slot || '-'}
          </span>
        </div>
        {task.notes && (
          <div className="flex items-start gap-2 bg-stone-50 rounded-xl p-2">
            <FileText className="w-3.5 h-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-stone-500">{task.notes}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 px-4 pb-4">
        <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={onClose}>略過</Button>
        <Button
          size="sm"
          className="flex-[2] bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md shadow-amber-200"
          onClick={() => {
            onAccept(task);
            openGoogleNavigation(task.gps_lat, task.gps_lng, task.address);
          }}
          disabled={accepting}
        >
          {accepting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
          接單導航
          <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
        </Button>
      </div>
    </div>
  );
}

// 任務縮圖卡（水平捲動）
function TaskMiniCard({ task, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex-shrink-0 w-52 rounded-2xl p-3 border cursor-pointer transition-all ${
        isSelected
          ? 'bg-amber-50 border-amber-300 shadow-md'
          : 'bg-white border-stone-100 hover:border-amber-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">{task.service_type}</Badge>
        {task.amount && <span className="text-xs font-bold text-green-700">NT${task.amount.toLocaleString()}</span>}
      </div>
      <div className="flex items-start gap-1.5 mb-1.5">
        <MapPin className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-stone-600 line-clamp-2 leading-snug">{task.address || '地址未提供'}</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-stone-400">
        <Calendar className="w-3 h-3" />
        <span>{task.scheduled_date ? format(new Date(task.scheduled_date), 'M/d', { locale: zhTW }) : '-'}</span>
        <Clock className="w-3 h-3 ml-1" />
        <span className="truncate">{task.time_slot?.split(' ')[0] || '-'}</span>
      </div>
      <div className="mt-2 text-right">
        <span className="text-xs font-medium text-amber-600">點擊查看 →</span>
      </div>
    </div>
  );
}

export default function TaskBottomPanel({ flashTasks, selectedTask, onSelectTask, onAccept, accepting }) {
  // snapState: 'peek' | 'half' | 'full'
  const [snapState, setSnapState] = useState('half');
  const dragStartY = useRef(null);
  const dragStartSnap = useRef(null);

  const currentHeight = snapState === 'peek' ? SNAP.peek
    : snapState === 'full' ? SNAP.full
    : SNAP.half;

  // 選中任務時自動展開到 full
  const handleSelectTask = (task) => {
    onSelectTask(task);
    if (task && snapState !== 'full') setSnapState('full');
  };

  const onDragStart = useCallback((clientY) => {
    dragStartY.current = clientY;
    dragStartSnap.current = snapState;
  }, [snapState]);

  const onDragEnd = useCallback((clientY) => {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - clientY; // 正 = 往上拉
    dragStartY.current = null;

    if (delta > 40) {
      // 往上拉
      setSnapState(s => s === 'peek' ? 'half' : 'full');
    } else if (delta < -40) {
      // 往下推
      setSnapState(s => s === 'full' ? 'half' : 'peek');
    }
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-2xl flex flex-col transition-all duration-300 ease-out"
      style={{ height: typeof currentHeight === 'number' ? `${currentHeight}px` : currentHeight }}
    >
      {/* ── Drag Handle ── */}
      <div
        className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={e => onDragStart(e.clientY)}
        onMouseUp={e => onDragEnd(e.clientY)}
        onTouchStart={e => onDragStart(e.touches[0].clientY)}
        onTouchEnd={e => onDragEnd(e.changedTouches[0].clientY)}
      >
        <div className="w-10 h-1 bg-stone-200 rounded-full mb-2" />
        {/* 標題列 */}
        <div className="flex items-center gap-2 w-full px-5">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-stone-700 flex-1">
            {flashTasks.length > 0 ? `閃電任務（${flashTasks.length}）` : '目前無閃電任務'}
          </span>
          {flashTasks.length > 0 && <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />}
        </div>
      </div>

      {/* ── 內容區（超過時可捲動） ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-6">
        {flashTasks.length === 0 ? (
          <p className="text-center text-xs text-stone-400 mt-4 px-6">
            附近目前沒有待接的閃電任務，系統每 30 秒自動更新
          </p>
        ) : (
          <>
            {/* 任務詳情（選中時） */}
            {selectedTask && (
              <div className="pt-2">
                <TaskDetailCard
                  task={selectedTask}
                  onAccept={onAccept}
                  accepting={accepting}
                  onClose={() => onSelectTask(null)}
                />
              </div>
            )}

            {/* 水平捲動任務縮圖列 */}
            <div
              className="flex gap-3 px-4 py-3 overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {flashTasks.map(task => (
                <TaskMiniCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTask?.id === task.id}
                  onClick={() => handleSelectTask(selectedTask?.id === task.id ? null : task)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}