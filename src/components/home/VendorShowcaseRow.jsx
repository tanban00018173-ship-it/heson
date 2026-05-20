import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Store } from 'lucide-react';
import { IconShop, IconBroom } from './CleaningIcons';

/* 單一商品卡片 — UberEats 風格 */
function ProductCard({ item, onTrack, onOpenDetail }) {
  const handleClick = () => {
    onTrack?.('click_card', { section_key: item.section_key, target_id: item.id, target_name: item.title });
    base44.entities.HomeSection.update(item.id, { click_count: (item.click_count || 0) + 1 }).catch(() => {});
    if (onOpenDetail) onOpenDetail(item);
  };

  // 格式化價格：整數 + 上標 00
  const priceInt = item.price ? Math.floor(item.price) : null;

  return (
    <button
      onClick={handleClick}
      className="flex-shrink-0 w-[38vw] max-w-[160px] text-left active:scale-95 transition-transform"
    >
      {/* 正方形圖片區 */}
      <div className="w-full aspect-square rounded-2xl overflow-hidden bg-stone-100 relative">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-100">
            <IconBroom className="w-12 h-12" />
          </div>
        )}
        {/* + 加入按鈕 */}
        <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
          <span className="text-stone-800 font-bold text-xl leading-none">+</span>
        </div>
        {item.badge && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </div>

      {/* 文字區 */}
      <div className="mt-2 px-0.5">
        {priceInt != null && (
          <p className="font-black text-stone-900 leading-none mb-1">
            <span className="text-sm">$</span>
            <span className="text-xl">{priceInt}</span>
            <sup className="text-[10px] font-bold align-super">00</sup>
          </p>
        )}
        <p className="text-[12px] text-stone-800 leading-snug line-clamp-2">
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-[11px] text-stone-400 mt-0.5 leading-tight">{item.subtitle}</p>
        )}
      </div>
    </button>
  );
}

/* 單一廠商展示列 */
function VendorRow({ vendor, items, onTrack, onOpenDetail }) {
  const navigate = useNavigate();

  if (!items.length) return null;

  return (
    <section className="bg-white mt-2 pt-5 pb-4">
      {/* 廠商標題列 */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-3">
          {/* 廠商 logo — 圓形大圖 */}
          <div className="w-14 h-14 rounded-full bg-white border-2 border-stone-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
            {vendor.logo_url ? (
              <img src={vendor.logo_url} alt={vendor.name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-6 h-6 text-stone-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-stone-900 leading-tight">
              {vendor.display_title || vendor.name}
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">訂購商家：{vendor.name}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/ServiceInquiry')}
          className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors flex-shrink-0"
        >
          <ArrowRight className="w-4 h-4 text-stone-700" />
        </button>
      </div>

      {/* 商品卡片橫向滾動 */}
      <div className="flex gap-3 pl-4 pr-2 overflow-x-auto pb-1 scrollbar-none">
        {items.map(item => (
          <ProductCard key={item.id} item={item} onTrack={onTrack} onOpenDetail={onOpenDetail} />
        ))}
      </div>
    </section>
  );
}

/* ─── 主組件：抓所有廠商，各自展示一列 ─── */
export default function VendorShowcaseRow({ allSections = [], onTrack, onOpenDetail }) {
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors-showcase'],
    queryFn: () => base44.entities.Vendor.list('created_date', 20),
  });

  if (!vendors.length) return null;

  const vendorItems = allSections.filter(s => s.provider_type === 'vendor' && s.is_active !== false);

  const grouped = {};
  vendorItems.forEach(item => {
    const vid = item.provider_id;
    if (!grouped[vid]) grouped[vid] = [];
    grouped[vid].push(item);
  });

  const activeVendors = vendors.filter(v => grouped[v.id]?.length > 0);

  if (!activeVendors.length) {
    // 無廠商卡片時顯示佔位
    return (
      <section className="bg-white mt-2 pt-5 pb-4">
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-stone-100 border-2 border-stone-200 flex items-center justify-center">
              <Store className="w-6 h-6 text-stone-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900">赫頌精選服務商</h2>
              <p className="text-sm text-stone-500 mt-0.5">即將上線更多服務</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 pl-4 pr-2 pb-1 overflow-x-auto scrollbar-none">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-[38vw] max-w-[160px]">
              <div className="w-full aspect-square rounded-2xl bg-stone-50 flex items-center justify-center"><IconShop className="w-10 h-10 opacity-30" /></div>
              <div className="mt-2 space-y-1.5">
                <div className="h-5 bg-stone-100 rounded w-2/3 animate-pulse" />
                <div className="h-3 bg-stone-50 rounded w-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      {activeVendors.map(vendor => (
        <VendorRow
          key={vendor.id}
          vendor={vendor}
          items={grouped[vendor.id] || []}
          onTrack={onTrack}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </>
  );
}