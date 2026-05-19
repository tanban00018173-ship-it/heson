import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Shield, Zap, ShoppingBag, Sparkles, Home, Wrench, Snowflake, RefreshCw } from 'lucide-react';
import { sortByRelevance } from '@/lib/useNearbyRecommend';
import { useTrack } from '@/lib/useTrack';

/* ─── DB 來源卡片 ─── */
function DbCard({ item, onTrack }) {
  const navigate = useNavigate();

  const handleClick = () => {
    onTrack('click_card', { section_key: item.section_key, target_id: item.id, target_name: item.title });
    // 增加 click_count（fire & forget）
    base44.entities.HomeSection.update(item.id, { click_count: (item.click_count || 0) + 1 }).catch(() => {});
    navigate('/ClientBooking');
  };

  return (
    <button
      onClick={handleClick}
      className="flex-shrink-0 w-44 rounded-2xl overflow-hidden text-left active:scale-95 transition-transform border border-stone-100 shadow-sm"
    >
      <div className="h-24 bg-stone-100 flex items-center justify-center relative overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">{item.emoji || '🧹'}</span>
        )}
        {item.badge && (
          <span className="absolute top-2 right-2 bg-white/90 text-stone-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </div>
      <div className="bg-white p-3">
        <p className="font-bold text-sm text-stone-800">{item.title}</p>
        <p className="text-[11px] text-stone-400 mt-0.5 leading-tight">{item.subtitle}</p>
        {item.price && (
          <p className="text-sm font-bold text-stone-900 mt-1.5">NT$ {item.price.toLocaleString()} 起</p>
        )}
      </div>
    </button>
  );
}

/* ─── 管理師卡片（口碑模塊用） ─── */
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
    <button
      onClick={handleClick}
      className="flex-shrink-0 w-40 bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 text-left active:scale-95 transition-transform"
    >
      <div className="relative h-24 bg-gradient-to-br from-stone-100 to-stone-200">
        {profile.profile_photo ? (
          <img src={profile.profile_photo} alt={profile.nickname} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {profile.nickname?.[0] || '🧹'}
          </div>
        )}
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
    <button
      onClick={() => { onTrack('click_card', { section_key: 'shop', target_id: product.id, target_name: product.name }); navigate('/ClientShop'); }}
      className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 text-left active:scale-95 transition-transform"
    >
      <div className="h-28 bg-stone-100 flex items-center justify-center relative overflow-hidden">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          : <ShoppingBag className="w-10 h-10 text-stone-300" />}
      </div>
      <div className="p-2.5">
        <p className="text-sm font-bold text-stone-900">NT$ {product.price?.toLocaleString()}</p>
        <p className="text-[11px] text-stone-600 mt-0.5 leading-tight line-clamp-2">{product.name}</p>
        {product.unit && <p className="text-[10px] text-stone-400 mt-0.5">{product.unit}</p>}
      </div>
    </button>
  );
}

/* ─── 橫向模塊容器 ─── */
function SectionRow({ icon: Icon, title, badge, cta, onCta, children, sectionKey, onTrack }) {
  React.useEffect(() => {
    onTrack('view_section', { section_key: sectionKey });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey]);

  return (
    <section className="bg-white mt-2 pt-4 pb-1">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-stone-600" />}
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

  // 從 DB 撈所有上架卡片
  const { data: allSections = [] } = useQuery({
    queryKey: ['homeSections'],
    queryFn: () => base44.entities.HomeSection.filter({ is_active: true }, 'sort_order', 100),
  });

  // 管理師
  const { data: profiles = [] } = useQuery({
    queryKey: ['cleanerProfiles-home'],
    queryFn: () => base44.entities.CleanerProfile.filter({ is_active: true }, '-created_date', 10),
  });

  // 管理師評論
  const { data: reviews = [] } = useQuery({
    queryKey: ['serviceReviews-home'],
    queryFn: () => base44.entities.ServiceReview.list('-created_date', 50),
    enabled: profiles.length > 0,
  });

  // 商店商品
  const { data: products = [] } = useQuery({
    queryKey: ['shopProducts-home'],
    queryFn: () => base44.entities.ShopProduct.filter({ is_active: true }, 'sort_order', 8),
  });

  // 取得某模塊卡片並套演算法排序
  const getSorted = (key) => sortByRelevance(allSections.filter(i => i.section_key === key), userAddress);
  const getReviews = (uid) => reviews.filter(r => r.cleaner_id === uid);

  // 管理師也套演算法（把 CleanerProfile 轉成相容格式）
  const sortedCleaners = sortByRelevance(
    profiles.map(p => ({
      ...p,
      gps_lat: p.gps_lat,
      gps_lng: p.gps_lng,
      service_areas: p.service_areas,
      click_count: 0,
      booking_count: 0,
      sort_order: 99,
    })),
    userAddress
  );

  const noOp = () => {};
  const safeTrack = track || noOp;

  return (
    <div>
      {/* 1. 閃電今日到府 */}
      {getSorted('flash').length > 0 && (
        <SectionRow icon={Zap} title="閃電今日到府" badge="快速" cta="立刻預約" onCta={() => navigate('/FlashTaskPost')} sectionKey="flash" onTrack={safeTrack}>
          {getSorted('flash').map(item => <DbCard key={item.id} item={item} onTrack={safeTrack} />)}
        </SectionRow>
      )}

      {/* 2. 口碑好評管理師 */}
      {sortedCleaners.length > 0 && (
        <SectionRow icon={Sparkles} title="口碑好評管理師" cta="查看全部" onCta={() => navigate('/CleanerTeam')} sectionKey="featured_cleaners" onTrack={safeTrack}>
          {sortedCleaners.map(p => <CleanerCard key={p.id} profile={p} reviews={getReviews(p.user_id)} onTrack={safeTrack} />)}
        </SectionRow>
      )}

      {/* 3. 定期包月方案 */}
      {getSorted('recurring').length > 0 && (
        <SectionRow icon={RefreshCw} title="定期包月省更多" cta="查看方案" onCta={() => navigate('/ClientBooking')} sectionKey="recurring" onTrack={safeTrack}>
          {getSorted('recurring').map(item => <DbCard key={item.id} item={item} onTrack={safeTrack} />)}
        </SectionRow>
      )}

      {/* 4. 大掃除 & 裝潢後細清 */}
      {getSorted('deep_clean').length > 0 && (
        <SectionRow icon={Home} title="大掃除 & 裝潢後細清" cta="了解更多" onCta={() => navigate('/ServiceInquiry')} sectionKey="deep_clean" onTrack={safeTrack}>
          {getSorted('deep_clean').map(item => <DbCard key={item.id} item={item} onTrack={safeTrack} />)}
        </SectionRow>
      )}

      {/* 5. 商店精選 */}
      {products.length > 0 && (
        <SectionRow icon={ShoppingBag} title="爆殺限量瘋搶 💥" badge="限時" cta="逛商店" onCta={() => navigate('/ClientShop')} sectionKey="shop" onTrack={safeTrack}>
          {products.map(p => <ProductCard key={p.id} product={p} onTrack={safeTrack} />)}
        </SectionRow>
      )}

      {/* 6. 家電清洗 */}
      {getSorted('appliance').length > 0 && (
        <SectionRow icon={Snowflake} title="家電清洗 讓家更健康" cta="預約清洗" onCta={() => navigate('/ServiceInquiry')} sectionKey="appliance" onTrack={safeTrack}>
          {getSorted('appliance').map(item => <DbCard key={item.id} item={item} onTrack={safeTrack} />)}
        </SectionRow>
      )}

      {/* 7. 布面清洗 */}
      {getSorted('fabric').length > 0 && (
        <SectionRow icon={Wrench} title="布面清洗 煥然一新" cta="預約清洗" onCta={() => navigate('/ServiceInquiry')} sectionKey="fabric" onTrack={safeTrack}>
          {getSorted('fabric').map(item => <DbCard key={item.id} item={item} onTrack={safeTrack} />)}
        </SectionRow>
      )}

      {/* 8. 整理收納 */}
      {getSorted('organize').length > 0 && (
        <SectionRow icon={Home} title="整理收納 換個心情" cta="立即預約" onCta={() => navigate('/ServiceInquiry')} sectionKey="organize" onTrack={safeTrack}>
          {getSorted('organize').map(item => <DbCard key={item.id} item={item} onTrack={safeTrack} />)}
        </SectionRow>
      )}
    </div>
  );
}