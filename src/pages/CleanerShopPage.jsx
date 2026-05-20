import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Star, MessageCircle, MapPin,
  CheckCircle, Clock, ChevronRight, Search, Users, Shield
} from 'lucide-react';

const SORT_TABS = ['綜合排名', '最新', '評分最高', '人氣'];

function ServiceCard({ item, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left active:scale-[0.98] transition-transform">
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-stone-100">
        {item.image_url
          ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-4xl">🧹</span></div>
        }
        {item.badge && (
          <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
            {item.badge}
          </span>
        )}
      </div>
      <div className="mt-1.5 px-0.5">
        <p className="text-xs text-stone-700 leading-snug line-clamp-2 font-medium">{item.title}</p>
        {item.subtitle && <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{item.subtitle}</p>}
        {item.price != null && (
          <p className="mt-1 font-black text-stone-900 text-sm">
            <span className="text-[10px] font-bold">NT$</span>
            {item.price.toLocaleString()}
            <span className="text-[10px] font-normal text-stone-400 ml-1">起</span>
          </p>
        )}
        {item.booking_count > 0 && (
          <p className="text-[10px] text-stone-400 mt-0.5">已完成 {item.booking_count} 件</p>
        )}
      </div>
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5 p-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="w-full aspect-square rounded-xl bg-stone-100 animate-pulse" />
          <div className="mt-2 h-3 bg-stone-100 rounded-full w-4/5 animate-pulse" />
          <div className="mt-1 h-3 bg-stone-100 rounded-full w-2/5 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/* ── 等級橫幅 ── */
function getLevel(years) {
  if (!years || years < 2) return { label: '清潔師傅', color: 'from-stone-400 to-stone-500', icon: '🧹' };
  if (years < 5) return { label: '清潔達人', color: 'from-amber-400 to-yellow-500', icon: '⭐' };
  return { label: '清潔大師', color: 'from-purple-500 to-purple-600', icon: '👑' };
}

export default function CleanerShopPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sortTab, setSortTab] = useState('綜合排名');
  const [search, setSearch] = useState('');
  const [cleanerId, setCleanerId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setCleanerId(p.get('cleaner') || p.get('id') || '');
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const { data: profiles = [], isLoading: loadingProfile } = useQuery({
    queryKey: ['cleanerShopProfile', cleanerId],
    queryFn: () => cleanerId
      ? base44.entities.CleanerProfile.filter({ user_id: cleanerId })
      : base44.entities.CleanerProfile.filter({ is_active: true }, '-created_date', 1),
    enabled: true,
  });
  const profile = profiles[0];

  const { data: reviews = [] } = useQuery({
    queryKey: ['cleanerShopReviews', profile?.user_id],
    queryFn: () => base44.entities.ServiceReview.filter({ cleaner_id: profile.user_id }, '-created_date', 50),
    enabled: !!profile?.user_id,
  });

  const { data: sections = [], isLoading: loadingSections } = useQuery({
    queryKey: ['cleanerShopSections', profile?.user_id],
    queryFn: () => base44.entities.HomeSection.filter({ provider_id: profile.user_id, is_active: true }),
    enabled: !!profile?.user_id,
  });

  // 取得所有追蹤此師傅的記錄（粉絲數）
  const { data: allFollows = [] } = useQuery({
    queryKey: ['follows', profile?.user_id],
    queryFn: () => base44.entities.Follow.filter({ target_id: profile.user_id }),
    enabled: !!profile?.user_id,
  });

  // 取得當前用戶是否已追蹤
  const { data: myFollow = [] } = useQuery({
    queryKey: ['myFollow', profile?.user_id, currentUser?.id],
    queryFn: () => base44.entities.Follow.filter({ follower_id: currentUser.id, target_id: profile.user_id }),
    enabled: !!profile?.user_id && !!currentUser?.id,
  });

  const isFollowed = myFollow.length > 0;
  const followerCount = allFollows.length;

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowed) {
        await base44.entities.Follow.delete(myFollow[0].id);
      } else {
        await base44.entities.Follow.create({
          follower_id: currentUser.id,
          follower_name: currentUser.full_name || '',
          target_id: profile.user_id,
          target_name: profile.nickname || '',
          target_type: 'cleaner',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows', profile?.user_id] });
      queryClient.invalidateQueries({ queryKey: ['myFollow', profile?.user_id, currentUser?.id] });
    },
  });

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  let items = [...sections];
  if (search) items = items.filter(i => i.title?.includes(search) || i.subtitle?.includes(search));
  if (sortTab === '最新') items.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  else if (sortTab === '評分最高') items.sort((a, b) => (b.booking_count || 0) - (a.booking_count || 0));
  else if (sortTab === '人氣') items.sort((a, b) => (b.click_count || 0) - (a.click_count || 0));

  const isLoading = loadingProfile || loadingSections;

  // 格式化粉絲數（如 1.2萬）
  function formatCount(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + '萬';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── 頂部搜尋列 ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-stone-100">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 flex-shrink-0">
            <ArrowLeft className="w-4 h-4 text-stone-700" />
          </button>
          <div className="flex-1 flex items-center bg-stone-100 rounded-full px-3 py-2 gap-2">
            <Search className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`搜尋 ${profile?.nickname || '師傅'} 的服務…`}
              className="flex-1 bg-transparent text-xs text-stone-700 placeholder-stone-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── 師傅 Banner（Shopee 橫排風格） ── */}
      <div className="relative bg-white overflow-hidden">
        {/* 背景封面模糊 */}
        <div className="absolute inset-0 z-0">
          {profile?.profile_photo
            ? <img src={profile.profile_photo} alt="" className="w-full h-full object-cover scale-110 blur-sm opacity-30" />
            : <div className="w-full h-full bg-gradient-to-r from-stone-400 to-stone-300" />
          }
        </div>

        {/* 主體橫排內容 */}
        <div className="relative z-10 flex items-center gap-3 px-3 py-4">

          {/* 頭像 + 等級橫幅 */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg bg-stone-100">
              {profile?.profile_photo
                ? <img src={profile.profile_photo} alt={profile?.nickname} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><span className="text-2xl">🧹</span></div>
              }
            </div>
            {/* 等級橫幅覆蓋在頭像偏下方 */}
            {(() => {
              const lv = getLevel(profile?.experience_years);
              return (
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-gradient-to-r ${lv.color} text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow whitespace-nowrap`}>
                  {lv.label}
                </span>
              );
            })()}
          </div>

          {/* 名稱、評分、粉絲 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h1 className="font-bold text-base text-white drop-shadow truncate">
                {profile?.nickname || (isLoading ? '載入中…' : '師傅')}
              </h1>
              <ChevronRight className="w-4 h-4 text-white/70 flex-shrink-0" />
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
              <span className="text-[10px] font-bold text-white drop-shadow">
                {avgRating || '－'}
              </span>
              <span className="text-white/60 text-[10px]">｜</span>
              <Users className="w-3 h-3 text-white/80 flex-shrink-0" />
              <span className="text-[10px] text-white drop-shadow font-semibold">
                {formatCount(followerCount)} 粉絲
              </span>
            </div>
          </div>

          {/* 操作按鈕欄 */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              disabled={!currentUser}
              onClick={() => followMutation.mutate()}
              className={`text-[11px] font-bold px-4 py-1.5 rounded-lg border transition-colors min-w-[72px] text-center ${
                isFollowed
                  ? 'bg-white/20 border-white/40 text-white'
                  : 'bg-white border-white text-stone-900'
              }`}
            >
              {isFollowed ? '已關注' : '+ 關注'}
            </button>
            <button
              onClick={() => navigate(`/ServiceInquiry?cleaner=${profile?.user_id}`)}
              className="flex items-center justify-center gap-1 bg-white/20 border border-white/40 text-white text-[11px] font-semibold px-4 py-1.5 rounded-lg min-w-[72px]"
            >
              <MessageCircle className="w-3 h-3" />聊聊
            </button>
          </div>
        </div>

        {/* 標籤列（緊接在 banner 下方，半透明背景） */}
        <div className="relative z-10 flex gap-1.5 px-3 pb-3 overflow-x-auto scrollbar-none">
          {profile?.police_record_verified && (
            <span className="flex-shrink-0 flex items-center gap-0.5 bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <CheckCircle className="w-2.5 h-2.5" />良民證
            </span>
          )}
          {profile?.experience_years && (
            <span className="flex-shrink-0 flex items-center gap-0.5 bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <Clock className="w-2.5 h-2.5" />{profile.experience_years} 年資歷
            </span>
          )}
          {profile?.residence_area && (
            <span className="flex-shrink-0 flex items-center gap-0.5 bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <MapPin className="w-2.5 h-2.5" />{profile.residence_area}
            </span>
          )}
          {(profile?.service_types || []).slice(0, 3).map(s => (
            <span key={s} className="flex-shrink-0 bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
      </div>

      {/* 導航 tabs */}
      <div className="bg-white border-b border-stone-100 flex text-xs font-semibold text-stone-400">
        {['作品', '服務項目', '評價', '師傅資訊'].map((tab, i) => (
          <button key={tab} className={`flex-1 py-2.5 border-b-2 transition-colors ${i === 0 ? 'text-stone-900 border-stone-900' : 'border-transparent'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── 排序列 ── */}
      <div className="border-t border-stone-100 flex items-center">
        {SORT_TABS.map((tab, idx) => (
          <div key={tab} className="flex-1 flex items-center">
            <button
              onClick={() => setSortTab(tab)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                sortTab === tab ? 'text-stone-900' : 'text-stone-400'
              }`}
            >
              {tab}
            </button>
            {idx < SORT_TABS.length - 1 && (
              <span className="w-px h-4 bg-stone-300" />
            )}
          </div>
        ))}
      </div>

      {/* ── 作品網格 ── */}
      <div className="mt-2 pb-24">
        {isLoading ? (
          <SkeletonGrid />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-5xl mb-3">🧹</span>
            <p className="text-sm font-medium text-stone-400">尚無作品</p>
            <p className="text-xs text-stone-300 mt-1">師傅尚未上架服務項目</p>
            <button
              onClick={() => navigate(`/ServiceInquiry?cleaner=${profile?.user_id}`)}
              className="mt-5 bg-stone-900 text-white text-xs font-bold px-5 py-2.5 rounded-full"
            >
              直接詢問預約
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[1px] bg-stone-100">
            {items.map(item => (
              <div key={item.id} className="bg-white p-3">
                <ServiceCard item={item} onClick={() => navigate(`/ServiceInquiry?cleaner=${profile?.user_id}&service=${item.id}`)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 評價區 ── */}
      {reviews.length > 0 && (
        <div className="bg-white mt-2 px-4 py-4 pb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-stone-800">客戶評價</h2>
            <button className="flex items-center gap-0.5 text-xs text-stone-400">
              查看全部 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {reviews.slice(0, 3).map(r => (
              <div key={r.id} className="bg-stone-50 rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center">
                    <span className="text-[10px]">👤</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-2.5 h-2.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-stone-400 ml-auto">
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