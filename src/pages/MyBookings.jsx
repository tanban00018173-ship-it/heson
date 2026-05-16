import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, MapPin, ChevronDown, ChevronUp, Trash2, Bell, CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const STATUS = {
  '待確認': { icon: Bell,         color: 'text-amber-500',  bg: 'bg-amber-50',   badge: 'bg-amber-100 text-amber-700',   label: '待確認' },
  '已確認': { icon: CheckCircle2, color: 'text-blue-500',   bg: 'bg-blue-50',    badge: 'bg-blue-100 text-blue-700',     label: '已確認' },
  '進行中': { icon: Loader2,      color: 'text-purple-500', bg: 'bg-purple-50',  badge: 'bg-purple-100 text-purple-700', label: '進行中' },
  '待結算': { icon: AlertCircle,  color: 'text-orange-500', bg: 'bg-orange-50',  badge: 'bg-orange-100 text-orange-700', label: '待結算' },
  '已完成': { icon: CheckCircle2, color: 'text-emerald-500',bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700',label: '已完成' },
  '已取消': { icon: XCircle,      color: 'text-stone-400',  bg: 'bg-stone-50',   badge: 'bg-stone-100 text-stone-500',   label: '已取消' },
  '扣留中': { icon: AlertCircle,  color: 'text-red-500',    bg: 'bg-red-50',     badge: 'bg-red-100 text-red-700',       label: '扣留中' },
};

function getStatusMsg(booking) {
  switch (booking.status) {
    case '待確認': return '您的預約已提交，我們正在為您確認服務時間。';
    case '已確認': return `您的服務已確認！管理師 ${booking.cleaner_name || '待指派'} 將於排定時間前往。`;
    case '進行中': return '管理師正在進行服務中，預計稍後完成。';
    case '待結算': return '服務已完成，請確認服務品質後結算款項。';
    case '已完成': return '服務圓滿完成！感謝您使用赫頌家事管理。';
    case '已取消': return '此筆預約已取消。';
    case '扣留中': return `帳款暫時扣留中：${booking.hold_reason || '請聯繫客服'}`;
    default: return '';
  }
}

function BookingCard({ booking, onCancel, onDelete, cancelingId }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const cfg = STATUS[booking.status] || STATUS['待確認'];
  const Icon = cfg.icon;
  const canCancel = booking.status === '待確認';
  const canReview = booking.status === '已完成';

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      {/* 收合列 */}
      <button
        className="w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-stone-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
          <Icon className={`w-5 h-5 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-semibold text-stone-800">{booking.service_type}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          </div>
          <p className="text-xs text-stone-400 truncate">{getStatusMsg(booking)}</p>
          <p className="text-[10px] text-stone-300 mt-1">
            {booking.scheduled_date} · {booking.time_slot?.split(' ')[0]}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-stone-300 flex-shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-stone-300 flex-shrink-0 mt-1" />
        )}
      </button>

      {/* 展開詳情 */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-stone-50">
          <div className="space-y-2 py-3">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Calendar className="w-4 h-4 text-stone-300 flex-shrink-0" />
              <span>{format(new Date(booking.scheduled_date), 'PPP', { locale: zhTW })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Clock className="w-4 h-4 text-stone-300 flex-shrink-0" />
              <span>{booking.time_slot}</span>
            </div>
            {booking.address && (
              <div className="flex items-start gap-2 text-sm text-stone-600">
                <MapPin className="w-4 h-4 text-stone-300 flex-shrink-0 mt-0.5" />
                <span>{booking.address}</span>
              </div>
            )}
            {booking.notes && (
              <div className="bg-stone-50 rounded-xl p-3 mt-2">
                <p className="text-xs text-stone-400 mb-0.5">備註</p>
                <p className="text-sm text-stone-600">{booking.notes}</p>
              </div>
            )}
          </div>

          <div className="text-[10px] text-stone-300 mb-3">
            預約編號：{booking.id.slice(0, 8)}
          </div>

          {/* CTA 按鈕 */}
          <div className="flex gap-2">
            {canReview && (
              <button
                className="flex-1 bg-black text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-stone-800 transition-colors"
                onClick={() => toast.info('評價功能開發中')}
              >
                立即評價
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => onCancel(booking.id)}
                disabled={cancelingId === booking.id}
                className="flex-1 bg-stone-100 text-stone-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-stone-200 transition-colors disabled:opacity-50"
              >
                {cancelingId === booking.id ? '取消中...' : '取消預約'}
              </button>
            )}
            <button
              onClick={() => onDelete(booking.id)}
              className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyBookings() {
  const [user, setUser] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [filter, setFilter] = useState('全部');

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['myBookings', user?.id],
    queryFn: () => base44.entities.Booking.filter({ client_id: user.id }),
    enabled: !!user,
  });

  const { data: clientProfile = [] } = useQuery({
    queryKey: ['clientProfile', user?.id],
    queryFn: () => base44.entities.ClientProfile.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });
  const profile = clientProfile?.[0];

  const handleCancelBooking = async (bookingId) => {
    setCancelingId(bookingId);
    try {
      await base44.entities.Booking.update(bookingId, { status: '已取消' });
      toast.success('預約已取消');
      refetch();
    } catch (error) {
      toast.error('取消失敗：' + error.message);
    } finally {
      setCancelingId(null);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      await base44.entities.Booking.delete(bookingId);
      toast.success('已刪除');
      refetch();
    } catch (error) {
      toast.error('刪除失敗：' + error.message);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const FILTERS = ['全部', '待確認', '已確認', '進行中', '已完成', '已取消'];
  const sorted = [...bookings].sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));
  const filtered = filter === '全部' ? sorted : sorted.filter(b => b.status === filter);
  const unreadCount = bookings.filter(b => b.status === '待確認' || b.status === '已確認').length;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 黑色頭部 */}
      <div className="bg-black pt-10 pb-5 px-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">通知</h1>
          {unreadCount > 0 && (
            <span className="text-xs bg-amber-500 text-white font-bold px-2.5 py-1 rounded-full">
              {unreadCount} 筆更新
            </span>
          )}
        </div>
        {/* 方案統計 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-base font-bold">{profile?.subscription_plan || '—'}</p>
            <p className="text-white/40 text-xs">目前方案</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-base font-bold">{profile?.remaining_visits ?? '—'}</p>
            <p className="text-white/40 text-xs">剩餘次數</p>
          </div>
        </div>
      </div>

      {/* 篩選 Tab */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-stone-100 bg-white sticky top-0 z-10">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
              filter === f ? 'bg-black text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 通知列表 */}
      <div className="flex-1 overflow-y-auto pb-28">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-stone-500 font-medium mb-1">沒有{filter === '全部' ? '' : filter}的預約</p>
            <p className="text-stone-400 text-sm">
              {filter === '全部' ? '立即預約，開始享受赫頌居家服務！' : '切換篩選查看其他狀態'}
            </p>
            {filter === '全部' && (
              <a href="/BookingForm">
                <button className="mt-5 bg-black text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-stone-800 transition-colors">
                  立即預約
                </button>
              </a>
            )}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="p-4 space-y-2">
            {filtered.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancelBooking}
                onDelete={(id) => setDeleteConfirmId(id)}
                cancelingId={cancelingId}
              />
            ))}
          </div>
        )}
      </div>

      <ClientBottomNav />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除預約？</AlertDialogTitle>
            <AlertDialogDescription>此操作無法撤銷，預約將永久刪除。</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>返回</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteBooking(deleteConfirmId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              確認刪除
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}