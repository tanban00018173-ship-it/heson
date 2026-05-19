import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Shield, Zap, ShoppingBag, Sparkles, Home, Wrench, Snowflake, RefreshCw, Package } from 'lucide-react';
import { sortByRelevance } from '@/lib/useNearbyRecommend';
import { useTrack } from '@/lib/useTrack';

/* ─── 隨機洗牌（Fisher-Yates） ─── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* 排序後加輕微隨機 jitter，確保每次刷新順序不同但熱門仍靠前 */
function sortWithJitter(items, userAddress) {
  const sorted = sortByRelevance(items, userAddress);
  return sorted.map(item => ({ ...item, _jitter: Math.random() * 30 }))
    .sort((a, b) => (b._score + b._jitter) - (a._score + a._jitter));
}

/* ─── 模塊定義 ─── */
const SECTION_DEFS = [
  { key: 'flash',            icon: Zap,        title: '閃電今日到府',      badge: '快速', cta: '立刻預約', ctaPath: '/FlashTaskPost' },
  { key: 'featured_cleaners',icon: Sparkles,   title: '口碑好評管理師',    badge: null,  cta: '查看全部', ctaPath: '/CleanerTeam' },
  { key: 'recurring',        icon: RefreshCw,  title: '定期包月省更多',    badge: null,  cta: '查看方案', ctaPath: '/ClientBooking' },
  { key: 'deep_clean',       icon: Home,       title: '大掃除 & 裝潢後細清', badge: null, cta: '了解更多', ctaPath: '/ServiceInquiry' },
  { key: 'shop',             icon: ShoppingBag,title: '爆殺限量瘋搶 💥',  badge: '限時', cta: '逛商店',  ctaPath: '/ClientShop' },
  { key: 'appliance',        icon: Snowflake,  title: '家電清洗 讓家更健康', badge: null, cta: '預約清洗', ctaPath: '/ServiceInquiry' },
  { key: 'fabric',           icon: Wrench,     title: '布面清洗 煥然一新', badge: null,  cta: '預約清洗', ctaPath: '/ServiceInquiry' },
  { key: 'organize',         icon: Package,    title: '整理收納 換個心情', badge: null,  cta: '立即預約', ctaPath: '/ServiceInquiry' },
];

/* ─── 卡片組件 ─── */
function DbCard({ item, onTrack }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => {
      onTrack('click_card', { section_key: item.section_key, target_id: item.id, target_name: item.title });
      base44.entities.HomeSection.update(item.id, { click_count: (item.click_count || 0) + 1 }).catch(() => {});
      navigate('/ClientBooking');
    }}
      className="flex-shrink-0 w-44 rounded-2xl overflow-hidden text-left active:scale-95 transition-transform border border-stone-100 shadow-sm bg-white"
    >
      <div className="h-24 bg-stone-100 flex items-center justify-center relative overflow-hidden">
        {item.image_url
          ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          : <span className="text-4xl">{item.emoji || '🧹'}</span>}
        {item.badge && <span className="absolute top-2 right-2 bg-white/90 text-stone-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm text-stone-800">{item.title}</p>
        <p className="text-[11px] text-stone-400 mt-0.5 leading-tight">{item.subtitle}</p>
        {item.price && <p className="text-sm font-bold text-stone-900 mt-1.5">NT$ {item.price.toLocaleString()} 起</p>}
      </div>
    </button>
  );
}

function CleanerCard({ profile, reviews = [], onTrack }) {
  const navigate = useNavigate();
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;
  return (
    <button onClick={() => { onTrack('click_cleaner', { section_key: 'featured_cleaners', target_id: profile.user_id, target_name: profile.nickname }); navigate(`/ServiceInquiry?cleaner=${profile.user_id}`); }}
      className="flex-shrink-0 w-40 bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 text-left active:scale-95 transition-transform"
    >
      <div className="relative h-24 bg-gradient-to-br from-stone-100 to-stone-200">
        {profile.profile_photo
          ? <img src={profile.profile_photo} alt={profile.nickname} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-3xl">{profile.nickname?.[0] || '🧹'}</div>}
        {profile.is_active && <span className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">接案中</span>}
      </div>
      <div className="p-2.5">
        <p className="font-semibold text-sm text-stone-800 truncate">{profile.nickname || '管理師'}</p>
        <p className="text-[10px] text-stone-400 truncate">{(profile.service_areas || []).slice(0, 2).join('・') || '全台服務'}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {avgRating && <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500"><Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />{avgRating}</span>}
          {profile.police_record_verified && <Shield className="w-2.5 h-2.5 text-blue-400" />}
          <span className="text-[10px] text-stone-400 ml-auto">{profile.experience_years || 1}年資</span>
        </div>
      </div>
    </button>
  );
}

function ProductCard({ product, onTrack }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => { onTrack('click_card', { section_key: 'shop', target_id: product.id, target_name: product.name }); navigate('/ClientShop'); }}
      className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 text-left active:scale-95 transition-transform"
    >
      <div className="h-28 bg-stone-100 flex items-center justify-center overflow-hidden">
        {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <ShoppingBag className="w-10 h-10 text-stone-300" />}
      </div>
      <div className="p-2.5">
        <p className="text-sm font-bold text-stone-900">NT$ {product.price?.toLocaleString()}</p>
        <p className="text-[11px] text-stone-600 mt-0.5 leading-tight line-clamp-2">{product.name}</p>
        {product.unit && <p className="text-[10px] text-stone-400 mt-0.5">{product.unit}</p>}
      </div>
    </button>
  );
}

function PlaceholderCards({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-44 rounded-2xl overflow-hidden border border-dashed border-stone-200 bg-stone-50">
          <div className="h-24 flex items-center justify-center text-stone-200 text-3xl">🧹</div>
          <div className="p-3">
            <div className="h-3 bg-stone-200 rounded-full w-3/4 mb-2 animate-pulse" />
            <div className="h-2.5 bg-stone-100 rounded-full w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
    </>
  );
}

/* ─── 橫向模塊列 ─── */
function SectionRow({ def, items, cleaners, reviews, products, onTrack }) {
  const navigate = useNavigate();
  const Icon = def.icon;

  useEffect(() => {
    onTrack('view_section', { section_key: def.key });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.key]);

  const renderContent = () => {
    if (def.key === 'featured_cleaners') {
      return cleaners.length > 0
        ? cleaners.map(p => <CleanerCard key={p.id} profile={p} reviews={reviews.filter(r => r.cleaner_id === p.user_id)} onTrack={onTrack} />)
        : <PlaceholderCards />;
    }
    if (def.key === 'shop') {
      return products.length > 0
        ? products.map(p => <ProductCard key={p.id} product={p} onTrack={onTrack} />)
        : <PlaceholderCards />;
    }
    return items.length > 0
      ? items.map(item => <DbCard key={item.id} item={item} onTrack={onTrack} />)
      : <PlaceholderCards />;
  };

  return (
    <section className="bg-white mt-2 pt-4 pb-1">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-stone-600" />
          <p className="text-sm font-bold text-stone-800">{def.title}</p>
          {def.badge && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-500 text-white rounded-full">{def.badge}</span>}
        </div>
        <button onClick={() => navigate(def.ctaPath)} className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors">
          {def.cta} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto pb-4 scrollbar-none">
        {renderContent()}
      </div>
    </section>
  );
}

/* ─── 主組件 ─── */
export default function HomeServiceSections({ user, userAddress }) {
  const track = useTrack(user, userAddress);
  const safeTrack = track || (() => {});

  const { data: allSections = [] } = useQuery({
    queryKey: ['homeSections'],
    queryFn: () => base44.entities.HomeSection.filter({ is_active: true }, 'sort_order', 100),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['cleanerProfiles-home'],
    queryFn: () => base44.entities.CleanerProfile.filter({ is_active: true }, '-created_date', 20),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['serviceReviews-home'],
    queryFn: () => base44.entities.ServiceReview.list('-created_date', 50),
    enabled: profiles.length > 0,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['shopProducts-home'],
    queryFn: () => base44.entities.ShopProduct.filter({ is_active: true }, 'sort_order', 16),
  });

  // 每個模塊的卡片，帶 jitter 排序（memo 在 allSections/userAddress 變化時重算）
  const sectionItemsMap = useMemo(() => {
    const map = {};
    SECTION_DEFS.forEach(def => {
      map[def.key] = sortWithJitter(allSections.filter(i => i.section_key === def.key), userAddress);
    });
    return map;
  }, [allSections, userAddress]);

  // 管理師帶 jitter
  const shuffledCleaners = useMemo(() => sortWithJitter(
    profiles.map(p => ({ ...p, click_count: 0, booking_count: 0, sort_order: 99 })),
    userAddress
  ), [profiles, userAddress]);

  // 商品 shuffle
  const shuffledProducts = useMemo(() => shuffle(products), [products]);

  // ── 無限滾動：維護已顯示的輪次 ──
  // 每輪 = 8 個模塊（隨機打亂順序）
  const [rounds, setRounds] = useState(() => [shuffle(SECTION_DEFS)]);
  const bottomRef = useRef(null);
  const loadingRef = useRef(false);

  const addRound = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setTimeout(() => {
      setRounds(prev => [...prev, shuffle(SECTION_DEFS)]);
      loadingRef.current = false;
    }, 300);
  }, []);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) addRound(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [addRound]);

  return (
    <div>
      {rounds.map((roundDefs, roundIdx) =>
        roundDefs.map(def => (
          <SectionRow
            key={`${roundIdx}-${def.key}`}
            def={def}
            items={sectionItemsMap[def.key] || []}
            cleaners={shuffledCleaners}
            reviews={reviews}
            products={shuffledProducts}
            onTrack={safeTrack}
          />
        ))
      )}
      {/* 底部觸發器 */}
      <div ref={bottomRef} className="h-16 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-500 rounded-full animate-spin" />
      </div>
    </div>
  );
}