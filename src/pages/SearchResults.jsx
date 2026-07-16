import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Star, Shield, MapPin } from 'lucide-react';
import SortFilterBar from '@/components/home/SortFilterBar';

const SORT_OPTIONS = [
  { value: 'latest', label: '最新' },
  { value: 'rating', label: '評分' },
  { value: 'popular', label: '人氣' },
];

export default function SearchResults() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const service = params.get('service') || '';
  const [sort, setSort] = useState('latest');

  const { data: cleaners = [], isLoading } = useQuery({
    queryKey: ['searchCleaners', service],
    queryFn: () => base44.entities.CleanerProfile.filter({ is_active: true }, '-created_date', 50),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['searchReviews'],
    queryFn: () => base44.entities.ServiceReview.list('-created_date', 100),
  });

  // 篩選有提供此服務的管理師
  const filtered = useMemo(() => {
    if (!service) return cleaners;
    return cleaners.filter(c =>
      !c.service_types || c.service_types.length === 0 ||
      c.service_types.some(s => s.includes(service) || service.includes(s))
    );
  }, [cleaners, service]);

  // 依排序方式整理
  const sorted = useMemo(() => {
    const withMeta = filtered.map(c => {
      const cReviews = reviews.filter(r => r.cleaner_id === c.user_id);
      const avgRating = cReviews.length
        ? cReviews.reduce((s, r) => s + (r.rating || 0), 0) / cReviews.length
        : 0;
      return { ...c, _avgRating: avgRating, _reviewCount: cReviews.length };
    });
    if (sort === 'rating') return withMeta.sort((a, b) => b._avgRating - a._avgRating);
    if (sort === 'popular') return withMeta.sort((a, b) => b._reviewCount - a._reviewCount);
    return withMeta.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [filtered, reviews, sort]);

  const getAvgRating = (cleanerId) => {
    const r = reviews.filter(r => r.cleaner_id === cleanerId);
    if (!r.length) return null;
    return (r.reduce((s, x) => s + (x.rating || 0), 0) / r.length).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <div>
          <h1 className="text-base font-bold text-stone-900">{service}</h1>
          <p className="text-xs text-stone-400">{isLoading ? '搜尋中…' : `找到 ${filtered.length} 位管理師`}</p>
        </div>
      </div>

      {/* Sort filter */}
      {!isLoading && filtered.length > 0 && (
        <div className="sticky top-[57px] z-10 bg-stone-50 px-4 pt-3 pb-1">
          <SortFilterBar options={SORT_OPTIONS} value={sort} onChange={setSort} />
        </div>
      )}

      {/* Results */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
          ))
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm">目前沒有符合「{service}」的管理師</p>
            <p className="text-xs mt-1">可嘗試填寫需求，我們會為您媒合</p>
            <button
              onClick={() => navigate('/ServiceInquiry?service=' + encodeURIComponent(service))}
              className="mt-4 px-6 py-2 bg-stone-900 text-white text-sm rounded-full"
            >
              填寫需求詢問
            </button>
          </div>
        ) : (
          sorted.map(cleaner => {
            const avg = getAvgRating(cleaner.user_id);
            return (
              <button
                key={cleaner.id}
                onClick={() => navigate(`/ServiceInquiry?cleaner=${cleaner.user_id}&service=${encodeURIComponent(service)}`)}
                className="w-full bg-white rounded-2xl p-4 flex gap-4 text-left shadow-sm border border-stone-100 active:scale-[0.99] transition-transform"
              >
                {/* 頭像 */}
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 flex items-center justify-center">
                  {cleaner.profile_photo
                    ? <img src={cleaner.profile_photo} alt={cleaner.nickname} className="w-full h-full object-cover" />
                    : <span className="text-2xl text-stone-300">👤</span>}
                </div>
                {/* 資訊 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-bold text-stone-900 text-sm">{cleaner.nickname || '管理師'}</p>
                    {cleaner.police_record_verified && <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                    {cleaner.is_active && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">接案中</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                    {avg && (
                      <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{avg}
                      </span>
                    )}
                    <span>{cleaner.experience_years || 1} 年資</span>
                    {cleaner.residence_area && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />{cleaner.residence_area}
                      </span>
                    )}
                  </div>
                  {cleaner.service_areas?.length > 0 && (
                    <p className="text-[11px] text-stone-400 truncate">
                      服務地區：{cleaner.service_areas.slice(0, 3).join('・')}
                    </p>
                  )}
                </div>
                {/* 箭頭 */}
                <div className="flex items-center text-stone-300">›</div>
              </button>
            );
          })
        )}
      </div>

      {/* 底部詢問 CTA */}
      {!isLoading && sorted.length > 0 && (
        <div className="px-4 pb-8 pt-2 text-center">
          <p className="text-xs text-stone-400 mb-2">沒有找到合適的管理師？</p>
          <button
            onClick={() => navigate('/ServiceInquiry?service=' + encodeURIComponent(service))}
            className="px-6 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-full"
          >
            填寫需求讓我們為您媒合
          </button>
        </div>
      )}
    </div>
  );
}