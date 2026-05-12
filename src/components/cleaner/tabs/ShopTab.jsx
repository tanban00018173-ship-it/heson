import React, { useState } from 'react';
import { ShoppingBag, Plus, Pencil, Trash2, X, Check, Package } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ShopTab({ user }) {
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['shop_products'],
    queryFn: () => base44.entities.ShopProduct.list('sort_order'),
  });

  const categories = ['全部', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const filtered = selectedCategory === '全部'
    ? products.filter(p => p.is_active !== false)
    : products.filter(p => p.is_active !== false && p.category === selectedCategory);

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

  return (
    <div className="flex-1 overflow-y-auto bg-white h-full">
      {/* 頂部橫幅 */}
      <div className="bg-black px-5 pt-8 pb-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-bold text-lg tracking-wide">赫頌商店</span>
            </div>
            <p className="text-white/50 text-xs tracking-wider">清潔劑・工具・新手禮包</p>
          </div>
          {isAdmin && (
            <button onClick={openNew} className="flex items-center gap-1.5 border border-white/30 hover:border-white text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> 新增商品
            </button>
          )}
        </div>
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
          <p className="text-sm">{isAdmin ? '尚無商品，點右上角新增' : '目前暫無商品'}</p>
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
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => openEdit(p)} className="w-6 h-6 bg-white/90 flex items-center justify-center shadow">
                      <Pencil className="w-3 h-3 text-stone-600" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(p.id)} className="w-6 h-6 bg-white/90 flex items-center justify-center shadow">
                      <Trash2 className="w-3 h-3 text-stone-400" />
                    </button>
                  </div>
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

      {/* 新增/編輯表單 */}
      {showForm && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 text-base">{editingProduct.id ? '編輯商品' : '新增商品'}</h3>
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