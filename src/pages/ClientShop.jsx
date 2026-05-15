import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, Package, Search, ShoppingCart } from 'lucide-react';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';
import { toast } from 'sonner';

export default function ClientShop() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['shop_products_public'],
    queryFn: () => base44.entities.ShopProduct.filter({ is_active: true }, 'sort_order'),
  });

  const categories = ['全部', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchCat = selectedCategory === '全部' || p.category === selectedCategory;
    const matchSearch = !search || p.name.includes(search) || (p.description || '').includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="pt-0 pb-28">
        {/* Header */}
        <div className="bg-white border-b border-stone-100 px-4 py-5 sticky top-0 z-30">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <h1 className="text-lg font-bold text-stone-900">赫頌商店</h1>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜尋商品..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-stone-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-amber-300 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-4">
          {/* Category tabs */}
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white'
                      : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-stone-300">
              <Package className="w-14 h-14 mb-3 opacity-40" />
              <p className="text-sm text-stone-400">目前沒有符合的商品</p>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="relative">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-36 object-cover" />
                    ) : (
                      <div className="w-full h-36 bg-stone-50 flex items-center justify-center">
                        <Package className="w-10 h-10 text-stone-200" />
                      </div>
                    )}
                    {p.tag && (
                      <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-full">
                        {p.tag}
                      </span>
                    )}
                    {p.stock === 0 && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="text-xs font-bold text-stone-500">已售完</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="text-sm font-semibold text-stone-800 leading-tight">{p.name}</p>
                    {p.description && (
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                    )}
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <span className="text-base font-bold text-stone-900">
                        NT${p.price.toLocaleString()}
                        <span className="text-stone-400 font-normal text-xs">/{p.unit || '個'}</span>
                      </span>
                      <button
                        onClick={() => toast.info('商品洽詢請聯繫客服：0906-991-023')}
                        disabled={p.stock === 0}
                        className="w-8 h-8 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-200 rounded-xl flex items-center justify-center transition-colors shadow-sm"
                      >
                        <ShoppingCart className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-stone-400 mt-8 mb-2">
            如需大量採購或詢價，請聯繫客服 0906-991-023
          </p>
        </div>
      </main>

      <ClientBottomNav />
    </div>
  );
}