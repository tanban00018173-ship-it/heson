import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Shield, Zap, ShoppingBag, Sparkles, Home, Wrench, Snowflake, RefreshCw } from 'lucide-react';
import { sortByRelevance } from '@/lib/useNearbyRecommend';
import { useTrack } from '@/lib/useTrack';

/* ─── DB 來源服務卡片 ─── */
function DbCard({ item, onTrack }) {
  const navigate = useNavigate();
  const handleClick = () => {
    onTrack('click_card', { section_key: item.section_key, target_id: item.id, target_name: item.title });
    base44.entities.HomeSection.update(item.id, { click_count: (item.click_count || 0) + 1 }).catch(() => {});
    navigate('/ClientBooking');
  };
  return (
    <button onClick={handleClick}
      className="flex-shrink-0 w-44 rounded-2xl overflow-hidden text-left active:scale-95 transition-transform border border-stone-100 shadow-sm">
      <div className="h-24 bg-stone-100 flex items-center justify-center relative overflow-hidden">
        {item.image_url
          ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          : <span className="text-4xl">{item.emoji || '🧹'}</span>}
        {item.badge && (
          <span className="absolute top-2 right-2 bg-white/90 text-stone-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
        )}
      </div>
      <div className="bg-white p-3">
        <p className="font-bold text-sm text-stone-800">{item.title}</p>
        <p className="text-[11px] text-stone-400 mt-0.5 leading-tight">{item.subtitle}</p>
        {item.price && <p className="text-sm font-bold text-stone-900 mt-1.5">NT$ {Number(item.price).toLocaleString()} 起</p>}
      </div>
    </button>
  );
}

/* ─── 管理師卡片（口碑模塊） ─── */
function CleanerCard({ profile, reviews = [], onTrack }) {
  const navigate = useNavigate();
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;
  const handleClick = () => {
    onTrack('click_cleaner', { section_key: 'featured_cleaners', target_id: profile.user_id, target_name: profile.nickname });
    navigate(`/ServiceInquiry?cleaner=${profile.user_id}`);
  };
  return (
    <button onClick={handleClick}
      className="flex-shrink-0 w-40 bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 text-left active:scale-95 transition-transform">
      <div className="relative h-24 bg-gradient-to-br from-stone-100 to-stone-200">
        {profile.profile_photo
          ? <img src={profile.profile_photo} alt={profile.nickname} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-3xl">{profile.nickname?.[0] || '🧹'}</div>}
        {profile.is_active && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">接案中</span>
        )}
      </div>
      <div className="p-2.5">
        <p className="font-semibold text-sm text-stone-800 truncate">{profile.nickname || '管理師'}</p>
        <p className="text-[10px] text-stone-400 truncate">{(profile.service_areas || []).slice(0, 2).join('・') || '全台服務'}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {avgRating && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />{avgRating}
            </span>
          )}
          {profile.police_record_verified && <Shield className="w-2.5 h-2.5 text-blue-400" />}
          <span className="text-[10px] text-stone-400 ml-auto">{profile.experience_years || 1}年資</span>
        </div>
      </div>
    </button>
  );
}

/* ─── 商品卡片 ─── */
function ProductCard({ product, onTrack }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => { onTrack('click_card', { section_key: 'shop', target_id: product.id, target_name: product.name }); navigate('/ClientShop'); }}
      className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 text-left active:scale-95 transition-transform">
      <div className="h-28 bg-stone-100 flex items-center justify-center relative overflow-hidden">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          : <ShoppingBag className="w-10 h-10 text-stone-300" />}
      </div>
      <div className="p-2.5">
        <p className="text-sm font-bold text-stone-900">NT$ {Number(product.price).toLocaleString()}</p>
        <p className="text-[11px] text-stone-600 mt-0.5 leading-tight line-clamp-2">{product.name}</p>
        {product.unit && <p className="text-[10px] text-stone-400 mt-0.5">{product.unit}</p>}
      </div>
    </button>
  );
}

/* ─── 橫向模塊容器（只有 children 才渲染）─── */
function SectionRow({ iconEl, title, badge, cta, onCta, sectionKey, onTrack, children }) {
  useEffect(() => {
    onTrack('view_section', { section_key: sectionKey });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey]);

  if (!children || (Array.isArray(children) && children.filter(Boolean).length === 0)) return null;

  return (
    <section className="bg-white mt-2 pt-4 pb-1">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          {iconEl}
          <p className="text-sm font-bold text-stone-800">{title}</p>
          {badge && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-500 text-white rounded-full">{badge}</span>}
        </div>
        {cta && (
          <button onClick={onCta} className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors">
            {cta} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto pb-4 scrollbar-none">
        {children}
      </div>
    </section>
  );
}

/* ─── 主組件 ─── */
export default function HomeServiceSections({ user, userAddress }) {
  const navigate = useNavigate();
  const track = useTrack(user, userAddress);

  const { data: allSections = [] } = useQuery({
    queryKey: ['homeSections'],
    queryFn: () => base44.entities.HomeSection.filter({ is_active: true }, 'sort_order', 100),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['cleanerProfiles-home'],
    queryFn: () => base44.entities.CleanerProfile.filter({ is_active: true }, '-created_date', 12),
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

  // 取得某模塊已排序卡片（全來自 DB）
  const getSorted = (key) => sortByRelevance(allSections.filter(i => i.section_key === key), userAddress);

  // 管理師列表也套排序演算法
  const sortedCleaners = sortByRelevance(
    profiles.map(p => ({ ...p, click_count: 0, booking_count: 0, sort_order: 99 })),
    userAddress
  );

  const getReviews = (uid) => reviews.filter(r => r.cleaner_id === uid);

  const SECTIONS = [
    { key: 'flash',             icon: <Zap className="w-4 h-4 text-stone-600" />,      title: '閃電今日到府',      badge: '快速', cta: '立刻預約', onCta: () => navigate('/FlashTaskPost') },
    { key: 'deep_clean',        icon: <Home className="w-4 h-4 text-stone-600" />,      title: '大掃除 & 裝潢後細清', cta: '了解更多', onCta: () => navigate('/ServiceInquiry') },
    { key: 'recurring',         icon: <RefreshCw className="w-4 h-4 text-stone-600" />, title: '定期包月省更多',     cta: '查看方案', onCta: () => navigate('/ClientBooking') },
    { key: 'appliance',         icon: <Snowflake className="w-4 h-4 text-stone-600" />, title: '家電清洗 讓家更健康', cta: '預約清洗', onCta: () => navigate('/ServiceInquiry') },
    { key: 'fabric',            icon: <Wrench className="w-4 h-4 text-stone-600" />,    title: '布面清洗 煥然一新',  cta: '預約清洗', onCta: () => navigate('/ServiceInquiry') },
    { key: 'organize',          icon: <Home className="w-4 h-4 text-stone-600" />,      title: '整理收納 換個心情',  cta: '立即預約', onCta: () => navigate('/ServiceInquiry') },
  ];

  return (
    <div>
      {/* 各 DB 驅動模塊 */}
      {SECTIONS.map(({ key, icon, title, badge, cta, onCta }) => {
        const items = getSorted(key);
        if (items.length === 0) return null;
        return (
          <SectionRow key={key} iconEl={icon} title={title} badge={badge} cta={cta} onCta={onCta} sectionKey={key} onTrack={track}>
            {items.map(item => <DbCard key={item.id} item={item} onTrack={track} />)}
          </SectionRow>
        );
      })}

      {/* 口碑管理師（來自 CleanerProfile） */}
      {sortedCleaners.length > 0 && (
        <SectionRow iconEl={<Sparkles className="w-4 h-4 text-stone-600" />} title="口碑好評管理師"
          cta="查看全部" onCta={() => navigate('/CleanerTeam')} sectionKey="featured_cleaners" onTrack={track}>
          {sortedCleaners.map(p => <CleanerCard key={p.id} profile={p} reviews={getReviews(p.user_id)} onTrack={track} />)}
        </SectionRow>
      )}

      {/* 商店精選 */}
      {products.length > 0 && (
        <SectionRow iconEl={<ShoppingBag className="w-4 h-4 text-stone-600" />} title="爆殺限量瘋搶 💥"
          badge="限時" cta="逛商店" onCta={() => navigate('/ClientShop')} sectionKey="shop" onTrack={track}>
          {products.map(p => <ProductCard key={p.id} product={p} onTrack={track} />)}
        </SectionRow>
      )}
    </div>
  );
}