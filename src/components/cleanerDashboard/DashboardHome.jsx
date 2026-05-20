import React from 'react';
import { Star, Users, ClipboardList, TrendingUp, ChevronRight, Bell, ExternalLink } from 'lucide-react';

function StatCard({ label, value, sub, color = 'stone' }) {
  const colors = {
    stone: 'bg-stone-900 text-white',
    amber: 'bg-amber-400 text-white',
    green: 'bg-green-500 text-white',
    blue:  'bg-blue-500 text-white',
  };
  return (
    <div className={`${colors[color]} rounded-2xl p-4 flex flex-col gap-1`}>
      <p className="text-[11px] font-semibold opacity-80">{label}</p>
      <p className="text-2xl font-black">{value ?? '－'}</p>
      {sub && <p className="text-[10px] opacity-70">{sub}</p>}
    </div>
  );
}

export default function DashboardHome({ user, profile, bookings, reviews, follows, navigate, onTabChange }) {
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const thisMonthBookings = bookings.filter(b => {
    const d = new Date(b.scheduled_date);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const completedCount = bookings.filter(b => b.status === '已完成').length;
  const pendingOrders = bookings.filter(b => b.status === '待確認');

  const totalIncome = bookings
    .filter(b => b.status === '已完成' && b.amount)
    .reduce((s, b) => s + b.amount, 0);

  return (
    <div>
      {/* Header */}
      <div className="bg-stone-900 px-4 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/30 bg-stone-700 flex-shrink-0">
              {profile?.profile_photo
                ? <img src={profile.profile_photo} alt="" className="w-full h-full object-cover" />
                : <span className="w-full h-full flex items-center justify-center text-xl">🧹</span>
              }
            </div>
            <div>
              <p className="text-[11px] text-white/60">歡迎回來</p>
              <p className="font-bold text-sm">{profile?.nickname || user.full_name || '師傅'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile?.is_active
              ? <span className="text-[10px] bg-green-500/30 text-green-300 font-bold px-2.5 py-1 rounded-full">接案中</span>
              : <span className="text-[10px] bg-white/10 text-white/60 font-bold px-2.5 py-1 rounded-full">暫停接案</span>
            }
          </div>
        </div>

        {/* 快速導覽至公開頁面 */}
        <button
          onClick={() => navigate(`/CleanerShopPage?cleaner=${user.id}`)}
          className="w-full flex items-center justify-between bg-white/10 rounded-xl px-3 py-2 text-xs text-white/80 hover:bg-white/20 transition-colors"
        >
          <span>查看我的公開頁面</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <StatCard label="本月訂單" value={thisMonthBookings.length} sub="件服務" color="stone" />
        <StatCard label="累積粉絲" value={follows.length} sub="位追蹤者" color="blue" />
        <StatCard label="服務評分" value={avgRating} sub={`共 ${reviews.length} 則評價`} color="amber" />
        <StatCard label="累積完成" value={completedCount} sub="件服務" color="green" />
      </div>

      {/* 待確認訂單提示 */}
      {pendingOrders.length > 0 && (
        <div className="mx-4 mb-4">
          <button
            onClick={() => onTabChange('orders')}
            className="w-full bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <Bell className="w-4 h-4 text-red-500 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-red-600">有 {pendingOrders.length} 筆訂單待確認</p>
              <p className="text-[11px] text-red-400">請盡快確認或拒絕</p>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* 快速功能列 */}
      <div className="mx-4 mb-4 bg-white rounded-2xl overflow-hidden border border-stone-100">
        {[
          { label: '管理訂單', sub: `${bookings.filter(b => ['待確認','已確認'].includes(b.status)).length} 筆進行中`, tab: 'orders', Icon: ClipboardList },
          { label: '上架服務', sub: '新增或編輯服務項目', tab: 'services', Icon: TrendingUp },
          { label: '客戶評價', sub: avgRating ? `平均 ${avgRating} 星` : '尚無評價', tab: 'reviews', Icon: Star },
          { label: '編輯個人頁', sub: '更新照片、簡介', tab: 'profile', Icon: Users },
        ].map(({ label, sub, tab, Icon }, i, arr) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-stone-50 transition-colors ${i < arr.length - 1 ? 'border-b border-stone-100' : ''}`}
          >
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4.5 h-4.5 text-stone-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-stone-800">{label}</p>
              <p className="text-[11px] text-stone-400">{sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300" />
          </button>
        ))}
      </div>

      {/* 近期收入 */}
      {totalIncome > 0 && (
        <div className="mx-4 mb-4 bg-gradient-to-r from-amber-500 to-orange-400 rounded-2xl p-4 text-white">
          <p className="text-[11px] opacity-80 mb-1">累積總收入</p>
          <p className="text-3xl font-black">NT$ {totalIncome.toLocaleString()}</p>
          <p className="text-[11px] opacity-70 mt-1">共 {completedCount} 筆已完成服務</p>
        </div>
      )}
    </div>
  );
}