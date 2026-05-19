import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminBottomNav from '@/components/dashboard/AdminBottomNav.jsx';
import { Plus, Package, ToggleLeft, ToggleRight, Edit3, AlertCircle } from 'lucide-react';

export default function AdminShopBackend() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('products');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) { base44.auth.redirectToLogin(); return; }
      base44.auth.me().then(u => {
        if (u.role !== 'admin') { navigate('/Home'); return; }
        setUser(u);
      });
    });
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['shopProducts'],
    queryFn: () => base44.entities.ShopProduct.list('sort_order'),
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ShopProduct.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopProducts'] }),
  });

  const activeCount = products.filter(p => p.is_active).length;
  const lowStock = products.filter(p => p.stock >= 0 && p.stock <= 5).length;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-stone-900 pt-10 pb-5 px-4 text-white">
        <p className="text-xs text-white/40 mb-1">商店管理</p>
        <p className="text-xl font-bold">赫頌商店</p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-lg font-bold">{products.length}</p>
            <p className="text-white/50 text-xs mt-0.5">總商品</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-300">{activeCount}</p>
            <p className="text-white/50 text-xs mt-0.5">上架中</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${lowStock > 0 ? 'bg-red-500/30' : 'bg-white/10'}`}>
            <p className={`text-lg font-bold ${lowStock > 0 ? 'text-red-300' : ''}`}>{lowStock}</p>
            <p className="text-white/50 text-xs mt-0.5">庫存不足</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-stone-100 px-4 pt-2">
        {[['products', '商品列表'], ['inventory', '庫存狀態']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`mr-4 pb-2 text-sm font-medium border-b-2 transition-colors
              ${tab === key ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-28 px-4 pt-3">
        {tab === 'products' && (
          <div className="space-y-2">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl">
                {p.image_url
                  ? <img src={p.image_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt={p.name} />
                  : <div className="w-12 h-12 rounded-xl bg-stone-200 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-stone-400" />
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800 truncate">{p.name}</p>
                  <p className="text-xs text-stone-500">NT${p.price} · {p.category || '無分類'}</p>
                  {p.stock === 0 && <p className="text-xs text-red-500">庫存為零</p>}
                </div>
                <button onClick={() => toggleMutation.mutate({ id: p.id, is_active: !p.is_active })}
                  className={`flex-shrink-0 transition-colors ${p.is_active ? 'text-green-500' : 'text-stone-300'}`}>
                  {p.is_active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                </button>
                <button onClick={() => navigate('/AdminShopProducts')}
                  className="flex-shrink-0 text-stone-400 hover:text-stone-700">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {products.length === 0 && <p className="text-stone-400 text-center py-12">尚無商品</p>}
          </div>
        )}
        {tab === 'inventory' && (
          <div className="space-y-2">
            {products.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  {p.stock === 0
                    ? <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    : <Package className="w-5 h-5 text-stone-400 flex-shrink-0" />
                  }
                  <p className="text-sm font-medium text-stone-800">{p.name}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${p.stock === 0 ? 'text-red-500' : p.stock < 0 ? 'text-stone-400' : p.stock <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                    {p.stock < 0 ? '無限' : p.stock}
                  </p>
                  <p className="text-[10px] text-stone-400">庫存</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 right-4 z-30">
        <button onClick={() => navigate('/AdminShopProducts')}
          className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center shadow-xl shadow-stone-900/30 hover:bg-stone-700 transition-colors">
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      <AdminBottomNav />
    </div>
  );
}