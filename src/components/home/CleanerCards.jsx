import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Shield, Zap } from 'lucide-react';

function CleanerCard({ profile, reviews = [] }) {
  const navigate = useNavigate();
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <button
      onClick={() => navigate(`/ServiceInquiry?cleaner=${profile.user_id}`)}
      className="flex-shrink-0 w-44 bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 text-left active:scale-95 transition-transform"
    >
      {/* Cover / Avatar */}
      <div className="relative h-28 bg-gradient-to-br from-stone-100 to-stone-200">
        {profile.profile_photo ? (
          <img src={profile.profile_photo} alt={profile.nickname} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">{profile.nickname?.[0] || '?'}</span>
          </div>
        )}
        {profile.is_active && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            接案中
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="font-semibold text-sm text-stone-800 truncate">{profile.nickname || '管理師'}</p>
        <p className="text-[11px] text-stone-400 mt-0.5 truncate">
          {(profile.service_areas || []).slice(0, 2).join('・') || '全台服務'}
        </p>

        <div className="flex items-center gap-2 mt-2">
          {avgRating && (
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {avgRating}
              <span className="text-stone-400 font-normal ml-0.5">({reviews.length})</span>
            </span>
          )}
          {profile.police_record_verified && (
            <Shield className="w-3 h-3 text-blue-500" />
          )}
        </div>
        <p className="text-[11px] text-stone-500 mt-1">年資 {profile.experience_years || 1}年</p>
      </div>
    </button>
  );
}

export default function CleanerCards() {
  const navigate = useNavigate();

  const { data: profiles = [] } = useQuery({
    queryKey: ['cleanerProfiles-home'],
    queryFn: () => base44.entities.CleanerProfile.filter({ is_active: true }, '-created_date', 10),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['serviceReviews-home'],
    queryFn: () => base44.entities.ServiceReview.list('-created_date', 50),
    enabled: profiles.length > 0,
  });

  if (profiles.length === 0) return null;

  const getReviews = (userId) => reviews.filter(r => r.cleaner_id === userId);

  return (
    <section className="pt-5 pb-2 bg-white mt-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <p className="text-sm font-bold text-stone-800">✨ 精選管理師</p>
        <button
          onClick={() => navigate('/CleanerTeam')}
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors"
        >
          查看全部 <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 px-4 overflow-x-auto pb-4 scrollbar-none">
        {profiles.map((p) => (
          <CleanerCard key={p.id} profile={p} reviews={getReviews(p.user_id)} />
        ))}
      </div>
    </section>
  );
}