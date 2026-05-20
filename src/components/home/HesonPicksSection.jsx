import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Shield, ArrowRight } from 'lucide-react';

function PickCard({ profile, avgRating, reviewCount, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[55vw] max-w-[240px] rounded-2xl overflow-hidden text-left active:scale-95 transition-transform border border-stone-100 shadow-sm bg-white flex flex-col"
    >
      <div className="relative h-40 bg-gradient-to-br from-stone-100 to-stone-200 overflow-hidden flex items-center justify-center flex-shrink-0">
        {profile.profile_photo
          ? <img src={profile.profile_photo} alt={profile.nickname} className="w-full h-full object-cover" />
          : <span className="text-5xl">🧹</span>
        }
        {profile.is_active && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">接案中</span>
        )}
      </div>
      <div className="p-3 flex gap-2.5">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {profile.profile_photo
            ? <img src={profile.profile_photo} alt={profile.nickname} className="w-full h-full object-cover" />
            : <span className="text-xl">🧹</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-stone-800">{profile.nickname || '管理師'}</p>
          <p className="text-[10px] text-stone-400 leading-tight">{(profile.service_areas || []).slice(0, 2).join('・') || '全台服務'}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {avgRating && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />{avgRating}
              </span>
            )}
            <span className="text-[10px] text-stone-600 font-semibold">{profile.experience_years || 1}年資</span>
            {profile.police_record_verified && <Shield className="w-2.5 h-2.5 text-blue-400" />}
          </div>
        </div>
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
    <section className="bg-white mt-2 pt-5 pb-2">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-xl font-black text-stone-900 tracking-tight">Heson 精選推薦</h2>
        <button
          onClick={() => navigate('/CleanerTeam')}
          className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors flex-shrink-0"
        >
          <ArrowRight className="w-4 h-4 text-stone-700" />
        </button>
      </div>
      <div className="flex gap-3 pl-4 pr-2 overflow-x-auto pb-4 scrollbar-none">
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