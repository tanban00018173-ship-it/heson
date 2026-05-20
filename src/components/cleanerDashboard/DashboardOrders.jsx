import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

const STATUS_TABS = ['全部', '待確認', '已確認', '進行中', '已完成', '已取消'];
const STATUS_COLOR = {
  '待確認': 'bg-yellow-100 text-yellow-700',
  '已確認': 'bg-blue-100 text-blue-700',
  '進行中': 'bg-green-100 text-green-700',
  '已完成': 'bg-stone-100 text-stone-600',
  '已取消': 'bg-red-100 text-red-500',
  '待結算': 'bg-purple-100 text-purple-700',
};

function OrderCard({ booking, onConfirm, onReject }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden mb-3">
      <button className="w-full px-4 py-3.5 text-left flex items-start gap-3" onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[booking.status] || 'bg-stone-100 text-stone-600'}`}>
              {booking.status}
            </span>
            {booking.is_flash_task && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⚡ 閃電</span>
            )}
          </div>
          <p className="font-semibold text-sm text-stone-800 truncate">{booking.service_type}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-400">
            <Calendar className="w-3 h-3" />
            <span>{booking.scheduled_date}</span>
            <span>｜</span>
            <Clock className="w-3 h-3" />
            <span>{booking.time_slot}</span>
          </div>
          {booking.address && (
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-stone-400">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{booking.address}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {booking.amount && (
            <span className="font-bold text-sm text-stone-900">NT$ {booking.amount.toLocaleString()}</span>
          )}
          <ChevronRight className={`w-4 h-4 text-stone-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-stone-100 px-4 py-3 bg-stone-50 space-y-2">
          {booking.client_name && <p className="text-xs text-stone-600"><span className="font-semibold">客戶：</span>{booking.client_name}</p>}
          {booking.phone && <p className="text-xs text-stone-600"><span className="font-semibold">電話：</span>{booking.phone}</p>}
          {booking.notes && <p className="text-xs text-stone-600"><span className="font-semibold">備註：</span>{booking.notes}</p>}
          {booking.status === '待確認' && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onConfirm(booking)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-stone-900 text-white text-xs font-bold py-2.5 rounded-xl"
              >
                <CheckCircle className="w-3.5 h-3.5" /> 確認接案
              </button>
              <button
                onClick={() => onReject(booking)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-red-300 text-red-500 text-xs font-bold py-2.5 rounded-xl"
              >
                <XCircle className="w-3.5 h-3.5" /> 婉拒
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardOrders({ bookings, navigate }) {
  const qc = useQueryClient();
  const [filterTab, setFilterTab] = useState('全部');

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Booking.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cleanerBookings'] }),
  });

  const filtered = filterTab === '全部'
    ? bookings
    : bookings.filter(b => b.status === filterTab);

  return (
    <div>
      <div className="sticky top-0 z-30 bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
        <h1 className="text-sm font-bold text-stone-800 flex-1">我的訂單</h1>
        <span className="text-[11px] text-stone-400">{bookings.length} 筆</span>
      </div>

      {/* Status filter */}
      <div className="bg-white border-b border-stone-100 flex overflow-x-auto scrollbar-none px-3 gap-1 py-2">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setFilterTab(s)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              filterTab === s ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
            }`}
          >
            {s}
            {s === '待確認' && bookings.filter(b => b.status === '待確認').length > 0 && (
              <span className="ml-1 bg-red-500 text-white rounded-full px-1 text-[9px]">
                {bookings.filter(b => b.status === '待確認').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <ClipboardListIcon />
            <p className="text-sm mt-3">目前沒有{filterTab !== '全部' ? filterTab : ''}訂單</p>
          </div>
        ) : (
          filtered.map(b => (
            <OrderCard
              key={b.id}
              booking={b}
              onConfirm={(bk) => {
                updateMutation.mutate({ id: bk.id, status: '已確認' });
                toast.success('已確認接案！');
              }}
              onReject={(bk) => {
                updateMutation.mutate({ id: bk.id, status: '已取消' });
                toast.success('已婉拒此訂單');
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ClipboardListIcon() {
  return (
    <div className="w-12 h-12 rounded-2xl bg-stone-100 mx-auto flex items-center justify-center">
      <span className="text-2xl">📋</span>
    </div>
  );
}