import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Store } from 'lucide-react';

/* 單一服務卡片 */
function ServiceCard({ item, onTrack }) {
  const navigate = useNavigate();

  const handleClick = () => {
    onTrack?.('click_card', { section_key: item.section_key, target_id: item.id, target_name: item.title });
    base44.entities.HomeSection.update(item.id, { click_count: (item.click_count || 0) + 1 }).catch(() => {});
    navigate('/ClientBooking');
  };

  return (
    <button
      onClick={handleClick}
      className="flex-shrink-0 w-40 text-left active:scale-95 transition-transform"
    >
      {/* 圖片區 */}
      <div className="w-full h-36 rounded-2xl overflow-hidden bg-stone-100 relative">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {item.emoji || '🧹'}
          </div>
        )}
        {/* + 加入按鈕 */}
        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
          <span className="text-stone-800 font-bold text-lg leading-none">+</span>
        </div>
        {item.badge && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </div>

      {/* 文字區 */}
      <div className="mt-2 px-0.5">
        {item.price ? (
          <p className="text-sm font-black text-stone-900">
            <span className="text-[11px] font-semibold">NT$</span>
            {item.price.toLocaleString()}
            <span className="text-[11px] font-normal text-stone-400"> 起</span>
          </p>
        ) : null}
        <p className="text-[12px] text-stone-700 mt-0.5 leading-snug line-clamp-2 font-medium">
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
function VendorRow({ vendor, items, onTrack }) {
  const navigate = useNavigate();

  if (!items.length) return null;

  return (
    <section className="bg-white mt-2 pt-4 pb-2">
      {/* 廠商標題列 */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-3">
          {/* 廠商 logo / icon */}
          <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {vendor.logo_url ? (
              <img src={vendor.logo_url} alt={vendor.name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-5 h-5 text-stone-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-black text-stone-900 leading-tight">{vendor.display_title || vendor.name}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">服務商：{vendor.name}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/ServiceInquiry')}
          className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors flex-shrink-0"
        >
          <ArrowRight className="w-4 h-4 text-stone-500" />
        </button>
      </div>

      {/* 服務卡片橫向滾動 */}
      <div className="flex gap-4 px-4 overflow-x-auto pb-3 scrollbar-none">
        {items.map(item => (
          <ServiceCard key={item.id} item={item} onTrack={onTrack} />
        ))}
      </div>
    </section>
  );
}

/* ─── 主組件：抓所有廠商，各自展示一列 ─── */
export default function VendorShowcaseRow({ allSections = [], onTrack }) {
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors-showcase'],
    queryFn: () => base44.entities.Vendor.list('created_date', 20),
  });

  if (!vendors.length) return null;

  // 把 allSections 裡 provider_type=vendor 的卡片按廠商 ID 分組
  const vendorItems = allSections.filter(s => s.provider_type === 'vendor' && s.is_active !== false);

  // 依廠商分組
  const grouped = {};
  vendorItems.forEach(item => {
    const vid = item.provider_id;
    if (!grouped[vid]) grouped[vid] = [];
    grouped[vid].push(item);
  });

  // 只顯示有卡片的廠商
  const activeVendors = vendors.filter(v => grouped[v.id]?.length > 0);

  if (!activeVendors.length) {
    // 若無廠商卡片，顯示一個示範佔位列
    return (
      <section className="bg-white mt-2 pt-4 pb-2">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center">
              <Store className="w-5 h-5 text-stone-400" />
            </div>
            <div>
              <p className="text-sm font-black text-stone-900">赫頌精選服務商</p>
              <p className="text-[11px] text-stone-400 mt-0.5">即將上線更多服務</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 px-4 pb-3 overflow-x-auto scrollbar-none">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-40">
              <div className="w-full h-36 rounded-2xl bg-stone-100 animate-pulse" />
              <div className="mt-2 space-y-1.5">
                <div className="h-4 bg-stone-100 rounded w-2/3 animate-pulse" />
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
        />
      ))}
    </>
  );
}