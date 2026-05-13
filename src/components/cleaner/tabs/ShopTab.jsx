import React, { useState } from 'react';
import { ShoppingBag, Plus, Package } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function ShopTab() {
  const [selectedCategory, setSelectedCategory] = useState('全部');

  const { data: products = [] } = useQuery({
    queryKey: ['shop_products'],
    queryFn: () => base44.entities.ShopProduct.list('sort_order'),
  });

  const categories = ['全部', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const filtered = selectedCategory === '全部'
    ? products.filter(p => p.is_active !== false)
    : products.filter(p => p.is_active !== false && p.category === selectedCategory);

  return (
    <div className="flex-1 overflow-y-auto bg-white h-full">
      {/* 頂部橫幅 */}
      <div className="bg-black px-5 pt-8 pb-5 text-white">
        <div className="flex items-center gap-2 mb-0.5">
          <ShoppingBag className="w-5 h-5" />
          <span className="font-bold text-lg tracking-wide">赫頌商店</span>
        </div>
        <p className="text-white/50 text-xs tracking-wider">清潔劑・工具・新手禮包</p>
      </div>

      {/* 分類切換 */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-stone-100">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat ? 'bg-black text-white' : 'bg-stone-100 text-stone-500'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* 商品列表 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-300">
          <Package className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">目前暫無商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-stone-100 border-b border-stone-100">
          {filtered.map(p => (
            <div key={p.id} className="bg-white flex flex-col">
              <div className="relative">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-stone-50 flex items-center justify-center">
                    <Package className="w-10 h-10 text-stone-200" />
                  </div>
                )}
                {p.tag && (
                  <span className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-0.5 font-medium">
                    {p.tag}
                  </span>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-stone-800 leading-snug">{p.name}</p>
                  {p.description && <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{p.description}</p>}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-stone-900">
                    NT${p.price}<span className="text-stone-400 font-normal text-xs">/{p.unit || '個'}</span>
                  </span>
                  <button className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}