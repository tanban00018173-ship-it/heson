import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Clock, ChevronDown, ChevronUp, Trash2, CheckCircle2, Circle, Loader2, ShoppingCart, MessageCircle, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/lib/CartContext';
import CartDrawer from '@/components/home/CartDrawer';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast } from 'sonner';

// 狀態進度步驟
const STATUS_STEPS = ['待確認', '已確認', '進行中', '待結算', '已完成'];

const statusIcon = {
  '待確認': '🕐',
  '已確認': '✅',
  '進行中': '🧹',
  '待結算': '💰',
  '已完成': '🎉',
  '已取消': '❌',
  '扣留中': '⏸️',
};

function ProgressBar({ status }) {
  if (status === '已取消' || status === '扣留中') {
    return (
      <div className="flex items-center gap-2 mt-3 px-1">
        <span className="text-xs text-stone-400">
          {status === '已取消' ? '此預約已取消' : '此預約暫時扣留中'}
        </span>
      </div>
    );
  }
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div className="mt-3 px-1">
      <div className="flex items-center justify-between relative">
        {/* 連線 */}
        <div className="absolute top-3 left-3 right-3 h-0.5 bg-stone-100 z-0" />
        <div
          className="absolute top-3 left-3 h-0.5 bg-black z-0 transition-all duration-500"
          style={{ width: currentIdx <= 0 ? '0%' : `${(currentIdx / (STATUS_STEPS.length - 1)) * (100 - (6 / STATUS_STEPS.length))}%` }}
        />
        {STATUS_STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={step} className="flex flex-col items-center gap-1 z-10" style={{ flex: 1 }}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                active ? 'bg-black border-black' :
                done ? 'bg-black border-black' :
                'bg-white border-stone-200'
              }`}>
                {done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> :
                 active ? <div className="w-2 h-2 bg-white rounded-full" /> :
                 <Circle className="w-3 h-3 text-stone-200" />}
              </div>
              <span className={`text-[9px] text-center leading-tight ${active ? 'font-bold text-black' : done ? 'text-stone-500' : 'text-stone-300'}`}>
                {step.replace('進行中', '進行')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingCard({ booking, onCancel, onDelete, cancelingId, isUnread, onRead }) {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    if (!expanded && isUnread) onRead(booking.id);
    setExpanded(!expanded);
  };

  return (
    <div
      className={`rounded-2xl border transition-colors duration-200 overflow-hidden ${
        isUnread ? 'bg-amber-50 border-amber-100' : 'bg-white border-stone-100'
      }`}
    >
      {/* 主列（可點擊展開） */}
      <button
        onClick={handleExpand}
        className="w-full flex items-start gap-3 px-4 py-4 text-left"
      >
        {/* 狀態 icon */}
        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0 text-lg mt-0.5">
          {statusIcon[booking.status] || '📋'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold text-stone-800 ${isUnread ? 'font-bold' : ''}`}>
              {booking.service_type}
            </p>
            {isUnread && <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {booking.scheduled_date} · {booking.time_slot?.split(' ')[0]}
          </p>
          <p className={`text-xs mt-1 font-medium ${
            booking.status === '已完成' ? 'text-emerald-600' :
            booking.status === '已取消' ? 'text-red-400' :
            booking.status === '待確認' ? 'text-amber-600' :
            'text-blue-600'
          }`}>
            {statusIcon[booking.status]} {booking.status}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-stone-400">
            {format(new Date(booking.created_date), 'MM/dd', { locale: zhTW })}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-stone-300" /> : <ChevronDown className="w-4 h-4 text-stone-300" />}
        </div>
      </button>

      {/* 展開詳細 */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-stone-100">
          {/* 進度條 */}
          <ProgressBar status={booking.status} />

          <div className="mt-4 space-y-2">
            {booking.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-stone-600">{booking.address}</p>
              </div>
            )}
            {booking.cleaner_name && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">管理師：</span>
                <span className="text-xs text-stone-700 font-medium">{booking.cleaner_name}</span>
              </div>
            )}
            {booking.notes && (
              <div className="bg-stone-50 rounded-xl px-3 py-2">
                <p className="text-xs text-stone-400 mb-0.5">備註</p>
                <p className="text-xs text-stone-600">{booking.notes}</p>
              </div>
            )}
            {booking.amount && (
              <div className="flex items-center justify-between bg-stone-50 rounded-xl px-3 py-2">
                <span className="text-xs text-stone-400">金額</span>
                <span className="text-sm font-bold text-stone-800">NT$ {booking.amount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            {booking.status === '待確認' && (
              <button
                onClick={() => onCancel(booking.id)}
                disabled={cancelingId === booking.id}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                {cancelingId === booking.id ? '取消中...' : '取消預約'}
              </button>
            )}
            <button
              onClick={() => onDelete(booking.id)}
              className="py-2 px-3 rounded-xl border border-red-100 text-xs font-medium text-red-400 hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> 刪除
            </button>
          </div>

          <p className="text-[10px] text-stone-300 mt-3 text-right">
            預約編號 {booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      )}
    </div>
  );
}

export default function MyBookings() {
  const [user, setUser] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  // 已讀 set（用 booking.id，存 sessionStorage）
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem('heson_read_bookings') || '[]')); }
    catch { return new Set(); }
  });

  useEffect(() => {
    const checkAuth = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    checkAuth();
  }, []);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['myBookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Booking.filter({ client_id: user.id }, '-created_date');
    },
    enabled: !!user,
  });

  const { data: clientProfile = [] } = useQuery({
    queryKey: ['clientProfile', user?.id],
    queryFn: () => base44.entities.ClientProfile.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });
  const profile = clientProfile?.[0];

  const handleRead = (id) => {
    setReadIds(prev => {
      const next = new Set([...prev, id]);
      try { sessionStorage.setItem('heson_read_bookings', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const handleReadAll = () => {
    const allIds = bookings.map(b => b.id);
    setReadIds(new Set(allIds));
    try { sessionStorage.setItem('heson_read_bookings', JSON.stringify(allIds)); } catch {}
  };

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
      toast.success('預約已刪除');
      refetch();
    } catch (error) {
      toast.error('刪除失敗：' + error.message);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const unreadCount = bookings.filter(b => !readIds.has(b.id)).length;
  const { totalCount, setOpen: setCartOpen } = useCart();

  const handleRequestNotification = async () => {
    if (!('Notification' in window)) {
      toast('此裝置不支援通知功能');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('已開啟通知！');
    } else {
      toast('請在手機設定中開啟通知權限');
    }
  };

  const notifPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="pt-0 pb-28">
        <div className="max-w-2xl mx-auto">

          {/* 頂部 Header — 與首頁相同佈局 */}
          <div className="bg-white border-b border-stone-100 px-4 py-3 sticky top-0 z-20">
            <div className="flex items-center gap-2">
              {/* 標題（佔滿左側空間） */}
              <h1 className="flex-1 text-lg font-bold text-stone-900">通知</h1>

              {/* 購物車 */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-stone-700" />
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalCount > 9 ? '9+' : totalCount}
                  </span>
                )}
              </button>

              {/* 聊聊 */}
              <Link
                to="/VendorChatPage"
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-900 hover:bg-stone-700 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </Link>
            </div>
          </div>

          <div className="px-4 pt-4">
            {/* 允許通知橫幅 */}
            {notifPermission !== 'granted' && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-4">
                <Bell className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-stone-700 font-medium leading-snug">
                    允許收到通知以獲得訂單更新進度及優惠
                  </p>
                  <button
                    onClick={handleRequestNotification}
                    className="text-xs text-blue-600 font-semibold mt-1 hover:text-blue-700 transition-colors"
                  >
                    允許
                  </button>
                </div>
                <button
                  onClick={(e) => e.currentTarget.closest('.bg-amber-50')?.remove()}
                  className="text-stone-300 hover:text-stone-400 transition-colors flex-shrink-0 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
              </div>
            )}

            {!isLoading && bookings.length === 0 && (
              <div className="text-center py-16">
                <Calendar className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                <p className="text-stone-400 text-sm mb-4">目前沒有任何預約</p>
                <a href="/BookingForm" className="inline-block bg-black text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-stone-800 transition-colors">
                  立即預約
                </a>
              </div>
            )}

            {!isLoading && bookings.length > 0 && (
              <>
                {/* 標題列 + 閱讀全部 */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-stone-800">訂單更新通知</p>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleReadAll}
                      className="text-xs text-black font-semibold hover:text-stone-500 transition-colors"
                    >
                      閱讀全部（{unreadCount}）
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {bookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onCancel={handleCancelBooking}
                      onDelete={(id) => setDeleteConfirmId(id)}
                      cancelingId={cancelingId}
                      isUnread={!readIds.has(booking.id)}
                      onRead={handleRead}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <CartDrawer />
      <ClientBottomNav />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除預約？</AlertDialogTitle>
            <AlertDialogDescription>此操作無法撤銷，預約將永久刪除。</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>取消</AlertDialogCancel>
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