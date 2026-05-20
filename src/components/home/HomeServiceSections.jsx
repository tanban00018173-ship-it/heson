import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Shield, Zap, ShoppingBag, Sparkles, Home, Wrench, Snowflake, RefreshCw, Package, Users } from 'lucide-react';
import { IconBroom, IconDeepClean, IconCleaner, IconRecurring, IconAC, IconFabric, IconOrganize, IconShop } from './CleaningIcons';
import { sortByRelevance } from '@/lib/useNearbyRecommend';
import { useTrack } from '@/lib/useTrack';
import VendorShowcaseRow from './VendorShowcaseRow';
import HesonPicksSection from './HesonPicksSection';
import ServiceDetailSheet from './ServiceDetailSheet';

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
  { key: 'deep_clean',       icon: Home,       title: '細清／大掃除', badge: null, cta: '了解更多', ctaPath: '/ServiceInquiry' },
  { key: 'shop',             icon: ShoppingBag,title: '爆殺限量瘋搶 💥',  badge: '限時', cta: '逛商店',  ctaPath: '/ClientShop' },
  { key: 'appliance',        icon: Snowflake,  title: '家電清洗 讓家更健康', badge: null, cta: '預約清洗', ctaPath: '/ServiceInquiry' },
  { key: 'fabric',           icon: Wrench,     title: '布面清洗 煥然一新', badge: null,  cta: '預約清洗', ctaPath: '/ServiceInquiry' },
  { key: 'organize',         icon: Package,    title: '整理收納 換個心情', badge: null,  cta: '立即預約', ctaPath: '/ServiceInquiry' },
];

/* ─── 卡片組件 ─── */
function DbCard({ item, onTrack, providerPhoto, onOpenDetail }) {
  return (
    <button onClick={() => {
      onTrack('click_card', { section_key: item.section_key, target_id: item.id, target_name: item.title });
      base44.entities.HomeSection.update(item.id, { click_count: (item.click_count || 0) + 1 }).catch(() => {});
      onOpenDetail(item);
    }}
      className="flex-shrink-0 w-[60vw] max-w-[260px] rounded-2xl overflow-hidden text-left active:scale-95 transition-transform border border-stone-100 shadow-sm bg-white"
    >
      <div className="h-36 bg-stone-100 flex items-center justify-center relative overflow-hidden">
        {item.image_url
          ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          : <IconBroom className="w-14 h-14" />}
        {item.badge && <span className="absolute top-2 right-2 bg-white/90 text-stone-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
      </div>
      <div className="p-3 flex gap-2">
        {providerPhoto ? (
          <img src={providerPhoto} alt="" className="w-12 h-12 rounded-full object-cover border border-stone-100 flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🧹</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base text-stone-900 leading-snug line-clamp-2">{item.title}</p>
          <p className="text-xs text-stone-400 mt-0.5 leading-tight line-clamp-1">{item.subtitle}</p>
          {item.price && <p className="text-sm font-bold text-stone-900 mt-1">NT$ {item.price.toLocaleString()} 起</p>}
        </div>
      </div>
    </button>
  );
}

function CleanerCard({ profile, reviews = [], follows = [], onTrack }) {
  const navigate = useNavigate();
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;
  const followerCount = follows.filter(f => f.target_id === profile.user_id && f.target_type === 'cleaner').length;
  
  return (
    <button onClick={() => {
      onTrack('click_cleaner', { section_key: 'featured_cleaners', target_id: profile.user_id, target_name: profile.nickname });
      navigate(`/CleanerShopPage?id=${profile.user_id}`);
    }}
      className="flex-shrink-0 w-[55vw] max-w-[240px] bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 text-left active:scale-95 transition-transform p-3 flex gap-3"
    >
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {profile.profile_photo
          ? <img src={profile.profile_photo} alt={profile.nickname} className="w-full h-full object-cover" />
          : <IconCleaner className="w-10 h-10" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-stone-800 truncate">{profile.nickname || '管理師'}</p>
        <p className="text-[10px] text-stone-400 truncate">{(profile.service_areas || []).slice(0, 2).join('・') || '全台服務'}</p>
        <div className="flex items-center gap-2 mt-2 text-[10px]">
          <div className="flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-bold text-stone-800">{avgRating || '—'}</span>
          </div>
          <span className="text-stone-300">|</span>
          <div className="flex items-center gap-0.5">
            <Users className="w-3 h-3 text-stone-400" />
            <span className="text-stone-600">{followerCount} 粉絲</span>
          </div>
        </div>
      </div>
      {profile.is_active && <span className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">接案中</span>}
    </button>
  );
}

function ProductCard({ product, onTrack }) {
  const navigate = useNavigate();
  const priceInt = product.price ? Math.floor(product.price) : null;
  return (
    <button onClick={() => { onTrack('click_card', { section_key: 'shop', target_id: product.id, target_name: product.name }); navigate('/ClientShop'); }}
      className="flex-shrink-0 w-[38vw] max-w-[160px] text-left active:scale-95 transition-transform"
    >
      <div className="w-full aspect-square rounded-2xl bg-stone-100 flex items-center justify-center overflow-hidden relative">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          : <IconShop className="w-12 h-12" />}
        <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
          <span className="text-stone-800 font-bold text-xl leading-none">+</span>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        {priceInt != null && (
          <p className="font-black text-stone-900 leading-none mb-1">
            <span className="text-sm">$</span>
            <span className="text-xl">{priceInt}</span>
            <sup className="text-[10px] font-bold align-super">00</sup>
          </p>
        )}
        <p className="text-[12px] text-stone-800 leading-snug line-clamp-2">{product.name}</p>
        {product.unit && <p className="text-[11px] text-stone-400 mt-0.5">{product.unit}</p>}
      </div>
    </button>
  );
}

function PlaceholderCards({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[60vw] max-w-[260px] rounded-2xl overflow-hidden border border-dashed border-stone-200 bg-stone-50">
          <div className="h-36 flex items-center justify-center bg-stone-50"><IconBroom className="w-12 h-12 opacity-40" /></div>
          <div className="p-3">
            <div className="h-3 bg-stone-200 rounded-full w-3/4 mb-2 animate-pulse" />
            <div className="h-2.5 bg-stone-100 rounded-full w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
    </>
  );
}

/* ─── 取得模塊頭像 ─── */
function getSectionAvatar(def, items, cleaners, products) {
  if (def.key === 'featured_cleaners') {
    return cleaners[0]?.profile_photo || null;
  }
  if (def.key === 'shop') {
    return products[0]?.image_url || null;
  }
  return items[0]?.image_url || null;
}

/* ─── 讓列表去重（已出現的 id 排後面） ─── */
function dedupeItems(items, usedIds) {
  const unused = items.filter(i => !usedIds.has(i.provider_id));
  const used   = items.filter(i =>  usedIds.has(i.provider_id));
  return [...unused, ...used];
}

function dedupeCleaners(cleaners, usedIds) {
  const unused = cleaners.filter(c => !usedIds.has(c.user_id));
  const used   = cleaners.filter(c =>  usedIds.has(c.user_id));
  return [...unused, ...used];
}

/* ─── 橫向模塊列 ─── */
function SectionRow({ def, items, cleaners, reviews, products, follows, onTrack, profiles, onOpenDetail }) {
  const navigate = useNavigate();

  useEffect(() => {
    onTrack('view_section', { section_key: def.key });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.key]);

  const avatarUrl = getSectionAvatar(def, items, cleaners, products);

  const renderContent = () => {
    if (def.key === 'featured_cleaners') {
      return cleaners.length > 0
        ? cleaners.map(p => <CleanerCard key={p.id} profile={p} reviews={reviews.filter(r => r.cleaner_id === p.user_id)} follows={follows} onTrack={onTrack} />)
        : <PlaceholderCards />;
    }
    if (def.key === 'shop') {
      return products.length > 0
        ? products.map(p => <ProductCard key={p.id} product={p} onTrack={onTrack} />)
        : <PlaceholderCards />;
    }
    return items.length > 0
      ? items.map(item => {
          const provider = profiles.find(p => p.user_id === item.provider_id);
          return <DbCard key={item.id} item={item} onTrack={onTrack} providerPhoto={provider?.profile_photo} onOpenDetail={onOpenDetail} />;
        })
      : <PlaceholderCards />;
  };

  return (
    <section className="bg-white mt-2 pt-5 pb-2">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2.5">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-stone-100 flex-shrink-0"
            />
          )}
          <h2 className="text-xl font-black text-stone-900 tracking-tight">{def.title}</h2>
          {def.badge && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-500 text-white rounded-full">{def.badge}</span>}
        </div>
        <button
          onClick={() => navigate(def.ctaPath)}
          className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors flex-shrink-0"
        >
          <ArrowRight className="w-4 h-4 text-stone-700" />
        </button>
      </div>
      <div className="flex gap-3 pl-4 pr-2 overflow-x-auto pb-4 scrollbar-none">
        {renderContent()}
      </div>
    </section>
  );
}

/* ─── 主組件 ─── */
export default function HomeServiceSections({ user, userAddress }) {
  const track = useTrack(user, userAddress);
  const safeTrack = track || (() => {});
  const [selectedService, setSelectedService] = useState(null);

  // 每次 mount 產生一個隨機 seed（useState 確保 effect deps 能偵測到）
  const [mountSeed] = useState(() => Math.random());

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

  const { data: follows = [] } = useQuery({
    queryKey: ['follows-home'],
    queryFn: () => base44.entities.Follow.list('-created_date', 200),
    enabled: profiles.length > 0,
  });

  // 每個模塊的卡片：資料到位後立即隨機，mount seed 確保每次進入頁面都重新洗牌
  const [sectionItemsMap, setSectionItemsMap] = useState({});
  useEffect(() => {
    if (!allSections.length) return;
    const map = {};
    SECTION_DEFS.forEach(def => {
      map[def.key] = shuffle(allSections.filter(i => i.section_key === def.key));
    });
    setSectionItemsMap(map);
  // mountSeed.current 確保頁面每次 mount 時都重新洗牌（即使快取資料未變）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSections, mountSeed.current]);

  // 管理師：資料到位後立即隨機
  const [shuffledCleaners, setShuffledCleaners] = useState([]);
  useEffect(() => {
    if (!profiles.length) return;
    setShuffledCleaners(shuffle(profiles.map(p => ({ ...p, click_count: 0, booking_count: 0, sort_order: 99 }))));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, mountSeed.current]);

  // 商品隨機
  const [shuffledProducts, setShuffledProducts] = useState([]);
  useEffect(() => {
    if (!products.length) return;
    setShuffledProducts(shuffle(products));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, mountSeed.current]);

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
      {selectedService && (
        <ServiceDetailSheet item={selectedService} onClose={() => setSelectedService(null)} />
      )}
      {/* ── 置頂：Heson 精選推薦（取前半段，避免與口碑模塊重複） ── */}
      <HesonPicksSection
        sections={shuffle(allSections).slice(0, 6)}
        profiles={profiles}
        onTrack={safeTrack}
        onOpenDetail={setSelectedService}
      />

      {rounds.map((roundDefs, roundIdx) => {
        const usedProviderIds = new Set();
        return (
        <React.Fragment key={roundIdx}>
          {roundDefs.map((def, defIdx) => {
            const rawItems = sectionItemsMap[def.key] || [];
            const dedupedItems = dedupeItems(rawItems, usedProviderIds);

            // featured_cleaners：取後半段（前半段已給 Heson 精選），避免重複
            // 未來邏輯：可依 def.key（section_key）篩選有對應標籤的管理師
            const half = Math.ceil(shuffledCleaners.length / 2);
            const cleanersPool = def.key === 'featured_cleaners'
              ? shuffledCleaners.slice(half)
              : shuffledCleaners;
            const dedupedCleaners = dedupeCleaners(cleanersPool, usedProviderIds);

            // 記錄本模塊第一個 provider（管理師或卡片）
            if (def.key === 'featured_cleaners') {
              const first = dedupedCleaners[0]?.user_id;
              if (first) usedProviderIds.add(first);
            } else {
              const first = dedupedItems[0]?.provider_id;
              if (first) usedProviderIds.add(first);
            }

            return (
            <React.Fragment key={`${roundIdx}-${def.key}`}>
              <SectionRow
                def={def}
                items={dedupedItems}
                cleaners={dedupedCleaners}
                reviews={reviews}
                products={shuffledProducts}
                follows={follows}
                onTrack={safeTrack}
                profiles={profiles}
                onOpenDetail={setSelectedService}
              />
              {/* 每輪第 4 個模塊後插入廠商展示列 */}
              {defIdx === 3 && (
                <VendorShowcaseRow
                  key={`vendor-${roundIdx}`}
                  allSections={allSections}
                  onTrack={safeTrack}
                  onOpenDetail={setSelectedService}
                />
              )}
            </React.Fragment>
            );
          })}
        </React.Fragment>
        );
      })}
      {/* 底部觸發器 */}
      <div ref={bottomRef} className="h-16 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-500 rounded-full animate-spin" />
      </div>
    </div>
  );
}