import React, { useState } from 'react';
import { ShoppingBag, Plus, Pencil, Trash2, X, Check, Package } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { useEffect } from 'react';

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs text-stone-400 font-medium mb-1 block">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
      />
    </div>
  );
}

export default function AdminShopProducts() {
  const [user, setUser] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    const load = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const u = await base44.auth.me();
      if (u.role !== 'admin') { window.location.href = '/'; return; }
      setUser(u);
    };
    load();
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['shop_products'],
    queryFn: () => base44.entities.ShopProduct.list('sort_order'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.ShopProduct.update(data.id, data)
      : base44.entities.ShopProduct.create(data),
    onSuccess: () => { qc.invalidateQueries(['shop_products']); setShowForm(false); setEditingProduct(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ShopProduct.delete(id),
    onSuccess: () => qc.invalidateQueries(['shop_products']),
  });

  const openNew = () => {
    setEditingProduct({ name: '', description: '', price: '', unit: '瓶', category: '', tag: '', image_url: '', stock: -1, is_active: true, sort_order: 99 });
    setShowForm(true);
  };
  const openEdit = (p) => { setEditingProduct({ ...p }); setShowForm(true); };
  const handleSave = () => {
    if (!editingProduct?.name || !editingProduct?.price) return;
    saveMutation.mutate({ ...editingProduct, price: Number(editingProduct.price), stock: Number(editingProduct.stock ?? -1), sort_order: Number(editingProduct.sort_order ?? 99) });
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <div className="hidden lg:block">
        <Sidebar userRole="admin" userName={user?.full_name} />
      </div>
      <MobileNav userRole="admin" userName={user?.full_name} />

      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-medium text-stone-800 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" /> 赫頌商店管理
              </h1>
              <p className="text-stone-500 mt-1">新增、編輯與下架商品</p>
            </div>
            <button onClick={openNew}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors">
              <Plus className="w-4 h-4" /> 新增商品
            </button>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-stone-300">
              <Package className="w-14 h-14 mb-3 opacity-30" />
              <p className="text-sm">尚無商品，點右上角新增</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="relative">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-36 object-cover" />
                    ) : (
                      <div className="w-full h-36 bg-stone-50 flex items-center justify-center">
                        <Package className="w-10 h-10 text-stone-200" />
                      </div>
                    )}
                    {p.tag && (
                      <span className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-0.5 font-medium rounded">
                        {p.tag}
                      </span>
                    )}
                    {!p.is_active && (
                      <span className="absolute top-2 right-2 bg-stone-500 text-white text-xs px-2 py-0.5 rounded">已下架</span>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-sm font-semibold text-stone-800">{p.name}</p>
                    {p.description && <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{p.description}</p>}
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <span className="text-base font-bold text-stone-900">
                        NT${p.price}<span className="text-stone-400 font-normal text-xs">/{p.unit || '個'}</span>
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="w-8 h-8 border border-stone-200 rounded-lg flex items-center justify-center hover:bg-stone-50">
                          <Pencil className="w-3.5 h-3.5 text-stone-500" />
                        </button>
                        <button onClick={() => { if (window.confirm(`確定刪除「${p.name}」？`)) deleteMutation.mutate(p.id); }}
                          className="w-8 h-8 border border-stone-200 rounded-lg flex items-center justify-center hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5 text-stone-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 新增/編輯表單 */}
      {showForm && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-stone-900 text-lg">{editingProduct.id ? '編輯商品' : '新增商品'}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <div className="space-y-3">
              <Field label="商品名稱 *" value={editingProduct.name} onChange={v => setEditingProduct(p => ({...p, name: v}))} placeholder="例：多功能清潔劑" />
              <Field label="商品描述" value={editingProduct.description} onChange={v => setEditingProduct(p => ({...p, description: v}))} placeholder="簡短說明用途或成分" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="售價（NT$）*" value={editingProduct.price} onChange={v => setEditingProduct(p => ({...p, price: v}))} type="number" placeholder="199" />
                <Field label="單位" value={editingProduct.unit} onChange={v => setEditingProduct(p => ({...p, unit: v}))} placeholder="瓶、組、包" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="分類" value={editingProduct.category} onChange={v => setEditingProduct(p => ({...p, category: v}))} placeholder="清潔劑、工具…" />
                <Field label="標籤" value={editingProduct.tag} onChange={v => setEditingProduct(p => ({...p, tag: v}))} placeholder="熱銷、新品…" />
              </div>
              <Field label="圖片網址" value={editingProduct.image_url} onChange={v => setEditingProduct(p => ({...p, image_url: v}))} placeholder="https://..." />
              <div className="grid grid-cols-2 gap-3">
                <Field label="庫存（-1=無限）" value={editingProduct.stock} onChange={v => setEditingProduct(p => ({...p, stock: v}))} type="number" placeholder="-1" />
                <Field label="排序（越小越前）" value={editingProduct.sort_order} onChange={v => setEditingProduct(p => ({...p, sort_order: v}))} type="number" placeholder="99" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={editingProduct.is_active !== false} onChange={e => setEditingProduct(p => ({...p, is_active: e.target.checked}))} className="w-4 h-4 accent-black" />
                <label htmlFor="is_active" className="text-sm text-stone-700">立即上架</label>
              </div>
            </div>
            <button onClick={handleSave} disabled={saveMutation.isPending}
              className="mt-5 w-full py-3 bg-black text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
              <Check className="w-4 h-4" />
              {saveMutation.isPending ? '儲存中...' : '儲存商品'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}