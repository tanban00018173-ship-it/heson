import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Plus, Sparkles, Zap } from 'lucide-react';

// 固定的服務卡片
const SERVICE_CARDS = [
  {
    id: 's1',
    type: 'service',
    emoji: '🧹',
    label: '輕量清潔',
    desc: '2–3小時，快速打掃',
    badge: '最受歡迎',
    badgeColor: 'bg-amber-400 text-white',
    bg: 'from-amber-50 to-orange-50',
    route: '/ClientBooking?service=輕量清潔',
  },
  {
    id: 's2',
    type: 'service',
    emoji: '🏠',
    label: '定期清潔',
    desc: '每週/每月固定到府',
    badge: '訂閱優惠',
    badgeColor: 'bg-emerald-500 text-white',
    bg: 'from-emerald-50 to-teal-50',
    route: '/ClientBooking?service=定期清潔',
  },
  {
    id: 's3',
    type: 'service',
    emoji: '🧺',
    label: '大掃除',
    desc: '深度全屋清潔',
    badge: '4–8小時',
    badgeColor: 'bg-blue-500 text-white',
    bg: 'from-blue-50 to-indigo-50',
    route: '/ClientBooking?service=大掃除',
  },
  {
    id: 's4',
    type: 'service',
    emoji: '🔨',
    label: '裝潢後細清',
    desc: '交屋前完美收尾',
    badge: '專業認證',
    badgeColor: 'bg-purple-500 text-white',
    bg: 'from-purple-50 to-pink-50',
    route: '/ClientBooking?service=裝潢後清潔',
  },
  {
    id: 's5',
    type: 'service',
    emoji: '❄️',
    label: '家電清洗',
    desc: '冷氣、洗衣機深洗',
    badge: '季節熱點',
    badgeColor: 'bg-sky-500 text-white',
    bg: 'from-sky-50 to-blue-50',
    route: '/ServiceInquiry?service=家電清洗',
  },
  {
    id: 's6',
    type: 'service',
    emoji: '⚡',
    label: '閃電任務',
    desc: '即時派遣，快速到府',
    badge: '限時',
    badgeColor: 'bg-rose-500 text-white',
    bg: 'from-rose-50 to-red-50',
    route: '/FlashTaskPost',
  },
];

function ServiceCard({ card, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 w-36 rounded-2xl overflow-hidden border border-stone-100 text-left active:scale-95 transition-transform bg-gradient-to-br ${card.bg} shadow-sm`}
    >
      <div className="p-3 pb-2">
        <div className="flex items-start justify-between mb-1.5">
          <span className="text-2xl leading-none">{card.emoji}</span>
          {card.badge && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${card.badgeColor}`}>
              {card.badge}
            </span>
          )}
        </div>
        <p className="text-sm font-bold text-stone-800">{card.label}</p>
        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{card.desc}</p>
      </div>
      <div className="px-3 pb-3">
        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-stone-700 bg-white/70 px-2 py-1 rounded-full">
          立即預約 →
        </span>
      </div>
    </button>
  );
}

function ProductCard({ product, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm text-left active:scale-95 transition-transform"
    >
      <div className="relative h-28 bg-stone-50">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
        )}
        {product.tag && (
          <span className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {product.tag}
          </span>
        )}
        <div className="absolute bottom-2 right-2 w-7 h-7 bg-black rounded-full flex items-center justify-center shadow">
          <Plus className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="p-3 pt-2">
        <p className="text-sm font-bold text-stone-900">
          <span className="text-xs font-normal">$</span>
          <span className="text-base">{Math.floor(product.price)}</span>
          <span className="text-xs text-stone-400">{(product.price % 1 > 0) ? String(product.price.toFixed(2)).split('.')[1] : '00'}</span>
        </p>
        <p className="text-[11px] text-stone-600 mt-0.5 leading-snug line-clamp-2">{product.name}</p>
        {product.unit && <p className="text-[10px] text-stone-400 mt-0.5">{product.unit}</p>}
      </div>
    </button>
  );
}

export default function ServiceShelf() {
  const navigate = useNavigate();

  const { data: products = [] } = useQuery({
    queryKey: ['shopProducts-home'],
    queryFn: () => base44.entities.ShopProduct.filter({ is_active: true }, 'sort_order', 6),
  });

  // 交叉插入：2 服務 + 1 商品 + 2 服務 + 1 商品...
  const mixed = [];
  let si = 0, pi = 0;
  while (si < SERVICE_CARDS.length || pi < products.length) {
    if (si < SERVICE_CARDS.length) mixed.push({ ...SERVICE_CARDS[si++], _type: 'service' });
    if (si < SERVICE_CARDS.length) mixed.push({ ...SERVICE_CARDS[si++], _type: 'service' });
    if (pi < products.length) mixed.push({ ...products[pi++], _type: 'product' });
  }

  return (
    <section className="pt-5 pb-2 bg-white mt-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-bold text-stone-800">今日推薦</p>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">服務・商品・特惠一次看</p>
        </div>
        <button
          onClick={() => navigate('/ClientShop')}
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors"
        >
          查看全部 <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 px-4 overflow-x-auto pb-4 scrollbar-none">
        {mixed.map((item, i) =>
          item._type === 'product' ? (
            <ProductCard
              key={`p-${item.id}`}
              product={item}
              onClick={() => navigate('/ClientShop')}
            />
          ) : (
            <ServiceCard
              key={`s-${item.id}`}
              card={item}
              onClick={() => navigate(item.route)}
            />
          )
        )}
      </div>
    </section>
  );
}