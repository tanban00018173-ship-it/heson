import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Shield, Award, ChevronRight } from 'lucide-react';

function PickCard({ profile, avgRating, reviewCount, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[62vw] max-w-[260px] rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform relative"
      style={{ background: 'linear-gradient(145deg, #1c1c1e 0%, #2c2c2e 100%)', border: '1px solid rgba(255,215,0,0.25)' }}
    >
      {/* 照片區 */}
      <div className="relative h-40 bg-stone-800 overflow-hidden">
        {profile.profile_photo
          ? <img src={profile.profile_photo} alt={profile.nickname} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center bg-stone-800">
              <Award className="w-14 h-14 text-stone-600" />
            </div>
        }
        {/* 金色漸層遮罩 */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(28,28,30,0.85) 0%, transparent 55%)' }} />
        {/* Heson Picks 徽章 */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: 'linear-gradient(90deg, #b8860b, #ffd700, #b8860b)', boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}>
          <Award className="w-2.5 h-2.5 text-black" />
          <span className="text-[9px] font-black text-black tracking-wide">HESON PICKS</span>
        </div>
        {/* 名稱浮在照片底部 */}
        <div className="absolute bottom-2.5 left-3 right-3">
          <p className="text-white font-bold text-sm leading-tight truncate">{profile.nickname || '管理師'}</p>
        </div>
      </div>

      {/* 資訊區 */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          {avgRating && (
            <span className="flex items-center gap-0.5 text-xs font-bold text-amber-400">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {avgRating}
              {reviewCount > 0 && <span className="text-stone-500 font-normal ml-0.5">({reviewCount})</span>}
            </span>
          )}
          {profile.police_record_verified && (
            <Shield className="w-3 h-3 text-blue-400 flex-shrink-0" />
          )}
          <span className="text-[10px] text-stone-500 ml-auto">{profile.experience_years || 1}年資</span>
        </div>
        <p className="text-[11px] text-stone-500 truncate">
          {(profile.service_areas || []).slice(0, 3).join('・') || '全台服務'}
        </p>
      </div>
    </button>
  );
}

export default function HesonPicksSection({ cleaners, reviews, onTrack }) {
  const navigate = useNavigate();

  if (!cleaners || cleaners.length === 0) return null;

  const getStats = (cleanerId) => {
    const rs = reviews.filter(r => r.cleaner_id === cleanerId);
    if (!rs.length) return { avgRating: null, reviewCount: 0 };
    return {
      avgRating: (rs.reduce((s, r) => s + (r.rating || 0), 0) / rs.length).toFixed(1),
      reviewCount: rs.length,
    };
  };

  return (
    <section className="mt-2 pt-5 pb-3" style={{ background: 'linear-gradient(180deg, #111111 0%, #1a1a1a 100%)' }}>
      {/* 標題列 */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Award className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg font-black tracking-tight" style={{ color: '#ffd700' }}>Heson 精選推薦</h2>
          </div>
          <p className="text-[11px] text-stone-500">嚴格審核・品質保證・值得信賴</p>
        </div>
        <button
          onClick={() => navigate('/CleanerTeam')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors"
          style={{ background: 'rgba(255,215,0,0.12)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' }}
        >
          查看全部
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* 卡片列表 */}
      <div className="flex gap-3 pl-4 pr-2 overflow-x-auto pb-2 scrollbar-none">
        {cleaners.map(profile => {
          const { avgRating, reviewCount } = getStats(profile.user_id);
          return (
            <PickCard
              key={profile.id}
              profile={profile}
              avgRating={avgRating}
              reviewCount={reviewCount}
              onClick={() => {
                onTrack?.('click_cleaner', { section_key: 'heson_picks', target_id: profile.user_id, target_name: profile.nickname });
                navigate(`/ServiceInquiry?cleaner=${profile.user_id}`);
              }}
            />
          );
        })}
      </div>
    </section>
  );
}