import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Shield, Zap, ShoppingBag, Clock, Sparkles, Home, Wrench, Snowflake } from 'lucide-react';

/* ─── 清潔師卡片 ─── */
function CleanerCard({ profile, reviews = [] }) {
  const navigate = useNavigate();
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <button
      onClick={() => navigate(`/ServiceInquiry?cleaner=${profile.user_id}`)}
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

/* ─── 服務方案卡片 ─── */
function ServiceCard({ emoji, title, subtitle, price, badge, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-44 rounded-2xl overflow-hidden text-left active:scale-95 transition-transform border border-stone-100 shadow-sm"
    >
      <div className={`h-24 ${color} flex items-center justify-center relative`}>
        <span className="text-4xl">{emoji}</span>
        {badge && (
          <span className="absolute top-2 right-2 bg-white/90 text-stone-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      <div className="bg-white p-3">
        <p className="font-bold text-sm text-stone-800">{title}</p>
        <p className="text-[11px] text-stone-400 mt-0.5 leading-tight">{subtitle}</p>
        {price && <p className="text-sm font-bold text-stone-900 mt-1.5">NT$ {price} 起</p>}
      </div>
    </button>
  );
}

/* ─── 商品卡片 ─── */
function ProductCard({ product }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/ClientShop')}
      className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 text-left active:scale-95 transition-transform"
    >
      <div className="h-28 bg-stone-100 flex items-center justify-center relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <ShoppingBag className="w-10 h-10 text-stone-300" />
        )}
        <button className="absolute bottom-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center border border-stone-200 text-stone-600 text-lg font-light leading-none">+</button>
      </div>
      <div className="p-2.5">
        <p className="text-sm font-bold text-stone-900">
          <span className="text-xs align-top mr-0.5">$</span>
          <span className="text-base">{Math.floor(product.price)}</span>
          <span className="text-xs">{String(product.price).includes('.') ? ('.' + String(product.price).split('.')[1]) : ''}</span>
        </p>
        <p className="text-[11px] text-stone-600 mt-0.5 leading-tight line-clamp-2">{product.name}</p>
        {product.unit && <p className="text-[10px] text-stone-400 mt-0.5">{product.unit}</p>}
      </div>
    </button>
  );
}

/* ─── 橫向模塊容器 ─── */
function SectionRow({ icon: Icon, title, badge, cta, onCta, children }) {
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

/* ─── 全寬 Banner 卡 ─── */
function WidePromoCard({ emoji, title, desc, buttonLabel, color, onClick }) {
  return (
    <div className={`mx-4 rounded-2xl p-4 ${color} flex items-center justify-between`}>
      <div>
        <p className="text-base font-bold text-stone-900">{title}</p>
        <p className="text-xs text-stone-600 mt-0.5 max-w-[180px]">{desc}</p>
        <button onClick={onClick} className="mt-3 bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-full">
          {buttonLabel}
        </button>
      </div>
      <span className="text-5xl">{emoji}</span>
    </div>
  );
}

/* ─── 主組件 ─── */
export default function HomeServiceSections() {
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

  const { data: products = [] } = useQuery({
    queryKey: ['shopProducts-home'],
    queryFn: () => base44.entities.ShopProduct.filter({ is_active: true }, 'sort_order', 8),
  });

  const getReviews = (userId) => reviews.filter(r => r.cleaner_id === userId);

  return (
    <div>
      {/* 1. 閃電今日到府 */}
      <SectionRow icon={Zap} title="閃電今日到府" badge="快速" cta="立刻預約" onCta={() => navigate('/FlashTaskPost')}>
        {[
          { emoji: '🧹', title: '輕量清潔', subtitle: '臥室、客廳、廁所快速整理', price: '990', badge: '最快2hr', color: 'bg-amber-50' },
          { emoji: '🪣', title: '全室清潔', subtitle: '每個角落徹底打掃', price: '1,800', badge: '好評第一', color: 'bg-blue-50' },
          { emoji: '🫧', title: '廚房深清', subtitle: '油煙機、爐具專業除垢', price: '1,200', badge: '熱門', color: 'bg-green-50' },
          { emoji: '🚿', title: '浴廁全清', subtitle: '水垢、黴菌、馬桶一次搞定', price: '800', badge: null, color: 'bg-purple-50' },
        ].map(s => <ServiceCard key={s.title} {...s} onClick={() => navigate('/ClientBooking')} />)}
      </SectionRow>

      {/* 2. 精選管理師 */}
      {profiles.length > 0 && (
        <SectionRow icon={Sparkles} title="口碑好評管理師" cta="查看全部" onCta={() => navigate('/CleanerTeam')}>
          {profiles.map(p => <CleanerCard key={p.id} profile={p} reviews={getReviews(p.user_id)} />)}
        </SectionRow>
      )}

      {/* 3. 定期包月方案 Banner */}
      <div className="mt-2 bg-white pt-4 pb-5">
        <WidePromoCard
          emoji="📅"
          title="定期清潔，越約越便宜"
          desc="月訂4次起，最高省下 30%，還有固定管理師服務"
          buttonLabel="查看方案"
          color="bg-amber-50"
          onClick={() => navigate('/ClientBooking')}
        />
      </div>

      {/* 4. 大掃除・裝潢清潔 */}
      <SectionRow icon={Home} title="大掃除 & 裝潢後細清" cta="了解更多" onCta={() => navigate('/ServiceInquiry')}>
        {[
          { emoji: '🏚️', title: '年終大掃除', subtitle: '全屋清潔、擦窗、整理', price: '3,500', badge: '年節限定', color: 'bg-rose-50' },
          { emoji: '🔨', title: '裝潢後細清', subtitle: '水泥粉塵、油漆去除', price: '4,500', badge: '專業團隊', color: 'bg-orange-50' },
          { emoji: '📦', title: '搬家前後清', subtitle: '交屋前後全面清潔', price: '2,800', badge: null, color: 'bg-teal-50' },
          { emoji: '🏘️', title: '民宿清潔', subtitle: 'Airbnb 換房快速整備', price: '1,500', badge: '熱搜', color: 'bg-indigo-50' },
        ].map(s => <ServiceCard key={s.title} {...s} onClick={() => navigate('/ClientBooking')} />)}
      </SectionRow>

      {/* 5. 商店精選商品 */}
      {products.length > 0 && (
        <SectionRow icon={ShoppingBag} title="爆殺限量瘋搶 💥" badge="限時" cta="逛商店" onCta={() => navigate('/ClientShop')}>
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </SectionRow>
      )}

      {/* 6. 家電清洗 */}
      <SectionRow icon={Snowflake} title="家電清洗 讓家更健康" cta="預約清洗" onCta={() => navigate('/ServiceInquiry?service=家電清洗')}>
        {[
          { emoji: '❄️', title: '冷氣清洗', subtitle: '濾網、蒸發器深層除菌', price: '1,200', badge: '夏季必備', color: 'bg-cyan-50' },
          { emoji: '🍽️', title: '洗碗機清洗', subtitle: '內部管路完整清潔', price: '900', badge: null, color: 'bg-emerald-50' },
          { emoji: '🥘', title: '烤箱深清', subtitle: '油垢碳化徹底去除', price: '800', badge: null, color: 'bg-yellow-50' },
          { emoji: '👕', title: '洗衣機槽洗', subtitle: '霉菌清除，衣物更乾淨', price: '1,000', badge: '熱門', color: 'bg-violet-50' },
        ].map(s => <ServiceCard key={s.title} {...s} onClick={() => navigate('/ClientBooking')} />)}
      </SectionRow>

      {/* 7. 整理收納 Banner */}
      <div className="mt-2 bg-white pt-4 pb-5">
        <WidePromoCard
          emoji="🗂️"
          title="整理收納，換個心情"
          desc="空間整理師到府規劃，讓家變得更舒適整潔"
          buttonLabel="立即預約"
          color="bg-stone-50"
          onClick={() => navigate('/ServiceInquiry?service=整理收納')}
        />
      </div>

      {/* 8. 布面清洗 */}
      <SectionRow icon={Wrench} title="布面清洗 煥然一新" cta="預約清洗" onCta={() => navigate('/ServiceInquiry?service=布面清洗')}>
        {[
          { emoji: '🛋️', title: '沙發清洗', subtitle: '布面、皮革深層除塵除菌', price: '1,500', badge: '最熱搜', color: 'bg-pink-50' },
          { emoji: '🛏️', title: '床墊清潔', subtitle: '蟎蟲、汙漬一次清除', price: '1,200', badge: '健康首選', color: 'bg-amber-50' },
          { emoji: '🪑', title: '椅子清洗', subtitle: '辦公椅、餐椅恢復如新', price: '600', badge: null, color: 'bg-lime-50' },
          { emoji: '🖼️', title: '窗簾清洗', subtitle: '到府拆裝，深度洗淨', price: '800', badge: null, color: 'bg-sky-50' },
        ].map(s => <ServiceCard key={s.title} {...s} onClick={() => navigate('/ClientBooking')} />)}
      </SectionRow>
    </div>
  );
}