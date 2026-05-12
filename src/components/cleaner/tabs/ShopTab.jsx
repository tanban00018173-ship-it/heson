import React, { useState } from 'react';
import { ShoppingBag, Plus, Tag, Star, Package } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

// 模擬商品資料（後台上架後從 entity 讀取）
const MOCK_PRODUCTS = [
  { id: 1, name: '深層清潔套餐', price: 2800, unit: '次', tag: '熱銷', image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300&q=80' },
  { id: 2, name: '居家環境消毒', price: 1500, unit: '次', tag: '新品', image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=300&q=80' },
  { id: 3, name: '冷氣濾網清洗', price: 800, unit: '台', tag: '', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&q=80' },
  { id: 4, name: '浴室深層除垢', price: 1200, unit: '次', tag: '推薦', image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=300&q=80' },
];

export default function ShopTab({ user }) {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const categories = ['全部', '清潔套餐', '特殊服務', '加購項目'];

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="w-5 h-5" />
          <span className="font-bold text-lg">服務商店</span>
        </div>
        <p className="text-white/80 text-sm">精選服務項目，一鍵加入行程</p>
      </div>

      {/* 分類切換 */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-amber-500 text-white'
                : 'bg-white text-stone-500 border border-stone-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 商品列表 */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {MOCK_PRODUCTS.map(p => (
          <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
            <div className="relative">
              <img src={p.image} alt={p.name} className="w-full h-28 object-cover" />
              {p.tag && (
                <span className="absolute top-2 left-2 bg-amber-400 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {p.tag}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-stone-800 mb-1">{p.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-amber-600 font-bold text-sm">NT${p.price}<span className="text-stone-400 font-normal text-xs">/{p.unit}</span></span>
                <button className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 管理員入口 */}
      {user?.role === 'admin' && (
        <div className="mx-4 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">後台管理</span>
          </div>
          <p className="text-xs text-amber-600 mb-3">在後台商品管理中上架或下架服務項目</p>
          <button className="w-full py-2 bg-amber-500 text-white text-sm font-medium rounded-xl">
            前往後台上架商品
          </button>
        </div>
      )}
    </div>
  );
}