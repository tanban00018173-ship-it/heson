import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Shield, Zap, ShoppingBag, Plus } from 'lucide-react';

// ── 1. 服務類別橫滑區 ──────────────────────────────────────────────
const SERVICE_TYPES = [
  { emoji: '🧹', label: '輕量清潔', sub: '2–3 小時快速整理', route: '/ClientBooking?type=輕量清潔', bg: 'from-sky-50 to-sky-100', accent: 'text-sky-600' },
  { emoji: '🏠', label: '定期清潔', sub: '每週/每月固定服務', route: '/ClientBooking?type=定期清潔', bg: 'from-teal-50 to-teal-100', accent: 'text-teal-600' },
  { emoji: '🧽', label: '大掃除', sub: '全屋深層徹底清潔', route: '/ClientBooking?type=大掃除', bg: 'from-amber-50 to-amber-100', accent: 'text-amber-600' },
  { emoji: '🏗️', label: '裝潢後細清', sub: '施工後粉塵油漆清除', route: '/ClientBooking?type=裝潢後清潔', bg: 'from-rose-50 to-rose-100', accent: 'text-rose-600' },
  { emoji: '🐾', label: '寵物居家', sub: '寵物毛髮專業處理', route: '/ClientBooking?type=寵物', bg: 'from-orange-50 to-orange-100', accent: 'text-orange-600' },
  { emoji: '🏨', label: '民宿清潔', sub: '退房快速翻房服務', route: '/ClientBooking?type=民宿清潔', bg: 'from-purple-50 to-purple-100', accent: 'text-purple-600' },
];

function ServiceTypesRow() {
  const navigate = useNavigate();
  return (
    <section className="bg-white mt-2 pt-4 pb-2">
      <div className="flex items-center justify-between px-4 mb-3">
        <p className="text-sm font-bold text-stone-800">🏆 選你需要的服務</p>
        <button onClick={() => navigate('/ClientBooking')} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors">
          全部 <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-2.5 px-4 overflow-x-auto pb-3 scrollbar-none">
        {SERVICE_TYPES.map(({ emoji, label, sub, route, bg, accent }) => (
          <button
            key={label}
            onClick={() => navigate(route)}
            className={`flex-shrink-0 w-32 bg-gradient-to-br ${bg} rounded-2xl p-3 text-left active:scale-95 transition-transform border border-white/60`}
          >
            <span className="text-2xl block mb-1.5">{emoji}</span>
            <p className={`text-sm font-bold ${accent}`}>{label}</p>
            <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">{sub}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── 2. 閃電任務 CTA Banner ─────────────────────────────────────────
function FlashBanner() {
  const navigate = useNavigate();
  return (
    <section className="px-4 mt-2">
      <button
        onClick={() => navigate('/FlashTaskPost')}
        className="w-full bg-gradient-to-r from-stone-900 to-stone-700 rounded-3xl p-5 flex items-center gap-4 text-left active:scale-[0.98] transition-transform overflow-hidden relative"
      >
        <span className="absolute right-4 top-2 text-5xl opacity-10 select-none">⚡</span>
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Zap className="w-6 h-6 text-yellow-400" />
        </div>
        <div className="flex-1">
          <span className="inline-block bg-yellow-400 text-stone-900 text-[9px] font-black px-2 py-0.5 rounded-full mb-1 uppercase tracking-widest">立即媒合</span>
          <p className="text-white font-black text-base leading-tight">今天想要立刻乾淨？</p>
          <p className="text-white/50 text-xs mt-0.5">發布閃電任務・10 分鐘確認・馬上到府</p>
        </div>
        <ArrowRight className="w-5 h-5 text-white/40 flex-shrink-0" />
      </button>
    </section>
  );
}

// ── 3. 精選管理師 ──────────────────────────────────────────────────
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
      <div className="relative h-28 bg-gradient-to-br from-stone-100 to-stone-200">
        {profile.profile_photo ? (
          <img src={profile.profile_photo} alt={profile.nickname} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">{profile.nickname?.[0] || '?'}</div>
        )}
        {profile.is_active && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">接案中</span>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm text-stone-800 truncate">{profile.nickname || '管理師'}</p>
        <p className="text-[11px] text-stone-400 mt-0.5 truncate">{(profile.service_areas || []).slice(0, 2).join('・') || '全台服務'}</p>
        <div className="flex items-center gap-2 mt-2">
          {avgRating && (
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{avgRating}
              <span className="text-stone-400 font-normal ml-0.5">({reviews.length})</span>
            </span>
          )}
          {profile.police_record_verified && <Shield className="w-3 h-3 text-blue-500" />}
        </div>
        <p className="text-[11px] text-stone-500 mt-1">年資 {profile.experience_years || 1} 年</p>
      </div>
    </button>
  );
}

function FeaturedCleaners({ profiles, reviews }) {
  const navigate = useNavigate();
  const getReviews = (userId) => reviews.filter(r => r.cleaner_id === userId);
  if (profiles.length === 0) return null;
  return (
    <section className="bg-white mt-2 pt-4 pb-2">
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <p className="text-sm font-bold text-stone-800">👩‍💼 認識我們的管理師</p>
          <p className="text-[11px] text-stone-400 mt-0.5">嚴選、認證、投保，放心交給她們</p>
        </div>
        <button onClick={() => navigate('/CleanerTeam')} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors">
          全部 <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto pb-4 scrollbar-none">
        {profiles.map((p) => <CleanerCard key={p.id} profile={p} reviews={getReviews(p.user_id)} />)}
      </div>
    </section>
  );
}

// ── 4. 熱銷清潔用品 ───────────────────────────────────────────────
function ProductCard({ product }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/ClientShop')}
      className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden border border-stone-100 text-left active:scale-95 transition-transform"
    >
      <div className="h-32 bg-stone-50 overflow-hidden relative">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🧴</div>
        )}
        {product.tag && (
          <span className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{product.tag}</span>
        )}
        <button
          onClick={e => { e.stopPropagation(); navigate('/ClientShop'); }}
          className="absolute bottom-2 right-2 w-7 h-7 bg-stone-900 rounded-full flex items-center justify-center shadow-md"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-bold text-stone-900">
          <span className="text-[10px] font-medium">$</span>{product.price}
          <span className="text-[9px] font-normal text-stone-400">元</span>
        </p>
        <p className="text-[11px] text-stone-600 mt-0.5 leading-tight line-clamp-2">{product.name}</p>
        {product.unit && <p className="text-[10px] text-stone-400 mt-0.5">{product.unit}</p>}
      </div>
    </button>
  );
}

function ShopSection({ products }) {
  const navigate = useNavigate();
  if (products.length === 0) return null;
  return (
    <section className="bg-white mt-2 pt-4 pb-2">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-stone-900 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-800">爆殺清潔用品 💥</p>
            <p className="text-[11px] text-stone-400">管理師同款，直送到家</p>
          </div>
        </div>
        <button onClick={() => navigate('/ClientShop')} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700">
          逛全部 <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-2.5 px-4 overflow-x-auto pb-4 scrollbar-none">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

// ── 5. 方案比較 CTA ────────────────────────────────────────────────
const PLANS = [
  { emoji: '🌱', label: '基礎月護', sub: '每月 4 次', price: '起', highlight: false },
  { emoji: '⭐', label: '進階月安', sub: '每月 8 次', price: '最熱門', highlight: true },
  { emoji: '👑', label: '尊榮月綻', sub: '每月 12 次', price: '超值', highlight: false },
];

function PlanSection() {
  const navigate = useNavigate();
  return (
    <section className="bg-white mt-2 px-4 pt-4 pb-5">
      <p className="text-sm font-bold text-stone-800 mb-1">📦 訂閱方案・越用越省</p>
      <p className="text-[11px] text-stone-400 mb-3">固定管理師・優先排班・省下每次重新預約的麻煩</p>
      <div className="flex gap-2.5">
        {PLANS.map(({ emoji, label, sub, price, highlight }) => (
          <button
            key={label}
            onClick={() => navigate('/ClientBooking')}
            className={`flex-1 rounded-2xl p-3 text-center border active:scale-95 transition-transform
              ${highlight ? 'bg-stone-900 border-stone-900 text-white' : 'bg-stone-50 border-stone-100 text-stone-700'}`}
          >
            <span className="text-xl block mb-1">{emoji}</span>
            <p className={`text-xs font-black ${highlight ? 'text-white' : 'text-stone-800'}`}>{label}</p>
            <p className={`text-[10px] mt-0.5 ${highlight ? 'text-white/60' : 'text-stone-400'}`}>{sub}</p>
            {highlight && (
              <span className="inline-block bg-yellow-400 text-stone-900 text-[8px] font-black px-1.5 py-0.5 rounded-full mt-1.5 uppercase tracking-wider">
                {price}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

// ── 6. 信任標章 ────────────────────────────────────────────────────
function TrustBadges() {
  const badges = [
    { emoji: '🛡️', label: '意外險投保', sub: '全程保障' },
    { emoji: '✅', label: '身份實名制', sub: '背景審核' },
    { emoji: '⭐', label: '4.9 好評', sub: '1,200+ 筆' },
    { emoji: '⚡', label: '10 分鐘媒合', sub: '即時確認' },
  ];
  return (
    <section className="bg-white mt-2 px-4 pt-4 pb-5">
      <p className="text-sm font-bold text-stone-800 mb-3">🔒 為什麼選擇 Heson？</p>
      <div className="grid grid-cols-4 gap-2">
        {badges.map(({ emoji, label, sub }) => (
          <div key={label} className="bg-stone-50 rounded-xl p-2.5 text-center border border-stone-100">
            <span className="text-xl block mb-1">{emoji}</span>
            <p className="text-[10px] font-bold text-stone-700 leading-tight">{label}</p>
            <p className="text-[9px] text-stone-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 主元件 ─────────────────────────────────────────────────────────
export default function HomeModules() {
  const { data: profiles = [] } = useQuery({
    queryKey: ['cleanerProfiles-home'],
    queryFn: () => base44.entities.CleanerProfile.filter({ is_active: true }, '-created_date', 10),
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ['serviceReviews-home'],
    queryFn: () => base44.entities.ServiceReview.list('-created_date', 50),
    enabled: profiles.length > 0,
  });
  const { data: products = [] } = useQuery({
    queryKey: ['shopProducts-home'],
    queryFn: () => base44.entities.ShopProduct.filter({ is_active: true }, 'sort_order', 8),
  });

  return (
    <>
      <ServiceTypesRow />
      <FlashBanner />
      <FeaturedCleaners profiles={profiles} reviews={reviews} />
      <ShopSection products={products} />
      <PlanSection />
      <TrustBadges />
    </>
  );
}