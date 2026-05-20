import React from 'react';
import { Star } from 'lucide-react';

export default function DashboardReviews({ reviews }) {
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const dist = [5, 4, 3, 2, 1].map(n => ({
    star: n,
    count: reviews.filter(r => r.rating === n).length,
  }));

  return (
    <div>
      <div className="sticky top-0 z-30 bg-white border-b border-stone-100 px-4 py-3">
        <h1 className="text-sm font-bold text-stone-800">客戶評價</h1>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <span className="text-4xl">⭐</span>
          <p className="text-sm mt-3">尚無評價</p>
        </div>
      ) : (
        <div className="p-4">
          {/* 評分總覽 */}
          <div className="bg-white rounded-2xl border border-stone-100 p-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-black text-stone-900">{avgRating}</p>
                <div className="flex gap-0.5 mt-1 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(parseFloat(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                  ))}
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">{reviews.length} 則評價</p>
              </div>
              <div className="flex-1 space-y-1">
                {dist.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 w-4 text-right">{star}</span>
                    <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300 flex-shrink-0" />
                    <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 w-4">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 評價列表 */}
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-stone-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-sm">👤</div>
                  <div className="flex-1">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-stone-400">
                    {r.created_date ? new Date(r.created_date).toLocaleDateString('zh-TW') : ''}
                  </span>
                </div>
                {r.comment && <p className="text-xs text-stone-600 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}