import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';

const STATUS_COLOR = {
  '待確認': 'bg-yellow-100 text-yellow-700',
  '已確認': 'bg-blue-100 text-blue-700',
  '進行中': 'bg-green-100 text-green-700',
  '已完成': 'bg-stone-100 text-stone-600',
  '已取消': 'bg-red-100 text-red-500',
};

export default function RecentBookings({ userId }) {
  const navigate = useNavigate();

  const { data: bookings = [] } = useQuery({
    queryKey: ['recentBookings-home', userId],
    queryFn: () => base44.entities.Booking.filter({ client_id: userId }, '-created_date', 4),
    enabled: !!userId,
  });

  if (!bookings.length) return null;

  return (
    <section className="pt-4 pb-2 bg-white mt-2">
      <div className="flex items-center justify-between px-4 mb-3">
        <p className="text-sm font-bold text-stone-800">🔄 再次預約</p>
        <button
          onClick={() => navigate('/MyBookings')}
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors"
        >
          查看全部 <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-3 px-4 overflow-x-auto pb-4 scrollbar-none">
        {bookings.map((b) => (
          <button
            key={b.id}
            onClick={() => navigate('/ClientBooking?service=' + encodeURIComponent(b.service_type))}
            className="flex-shrink-0 w-44 bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden text-left active:scale-95 transition-transform"
          >
            {/* Color strip */}
            <div className="h-2 bg-gradient-to-r from-stone-800 to-stone-600" />
            <div className="p-3">
              <p className="text-sm font-semibold text-stone-800 leading-tight truncate">{b.service_type}</p>
              <p className="text-[11px] text-stone-400 mt-1 truncate">{b.cleaner_name || '未指派'}</p>
              <div className="flex items-center gap-1 mt-2">
                <Clock className="w-3 h-3 text-stone-400" />
                <span className="text-[10px] text-stone-400">{b.scheduled_date}</span>
              </div>
              {b.status && (
                <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status] || 'bg-stone-100 text-stone-500'}`}>
                  {b.status}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}