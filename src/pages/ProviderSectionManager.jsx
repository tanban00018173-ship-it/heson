/**
 * ProviderSectionManager — 師傅/廠商後台管理首頁推薦卡片
 * 路徑：/ProviderSectionManager
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SECTION_LABELS = {
  flash: '⚡ 閃電今日到府',
  featured_cleaners: '⭐ 口碑好評管理師',
  deep_clean: '🏚️ 大掃除 & 裝潢後細清',
  appliance: '❄️ 家電清洗',
  recurring: '📅 定期包月方案',
  fabric: '🛋️ 布面清洗',
  organize: '🗂️ 整理收納',
};

const EMPTY_FORM = {
  section_key: 'flash',
  title: '',
  subtitle: '',
  price: '',
  emoji: '🧹',
  badge: '',
  service_areas: [],
  gps_lat: '',
  gps_lng: '',
  image_url: '',
  is_active: true,
  sort_order: 99,
};

export default function ProviderSectionManager() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [areasInput, setAreasInput] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: items = [] } = useQuery({
    queryKey: ['my-home-sections', user?.id],
    queryFn: () => base44.entities.HomeSection.filter({ provider_id: user.id }),
    enabled: !!user?.id,
  });

  const save = useMutation({
    mutationFn: (data) =>
      editing
        ? base44.entities.HomeSection.update(editing.id, data)
        : base44.entities.HomeSection.create({ ...data, provider_id: user.id, provider_name: user.full_name, provider_type: 'cleaner' }),
    onSuccess: () => {
      qc.invalidateQueries(['my-home-sections']);
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.HomeSection.delete(id),
    onSuccess: () => qc.invalidateQueries(['my-home-sections']),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.HomeSection.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries(['my-home-sections']),
  });

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      section_key: item.section_key,
      title: item.title || '',
      subtitle: item.subtitle || '',
      price: item.price || '',
      emoji: item.emoji || '🧹',
      badge: item.badge || '',
      service_areas: item.service_areas || [],
      gps_lat: item.gps_lat || '',
      gps_lng: item.gps_lng || '',
      image_url: item.image_url || '',
      is_active: item.is_active !== false,
      sort_order: item.sort_order || 99,
    });
    setAreasInput((item.service_areas || []).join('、'));
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const areas = areasInput.split(/[、,，\s]+/).filter(Boolean);
    save.mutate({ ...form, service_areas: areas, price: form.price ? Number(form.price) : null, gps_lat: form.gps_lat ? Number(form.gps_lat) : null, gps_lng: form.gps_lng ? Number(form.gps_lng) : null });
  };

  const grouped = EMPTY_FORM && items.reduce((acc, item) => {
    const key = item.section_key;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-stone-100">
        <button onClick={() => navigate(-1)}><ChevronLeft className="w-5 h-5 text-stone-600" /></button>
        <h1 className="text-base font-bold text-stone-800 flex-1">首頁推薦管理</h1>
        <button
          onClick={() => { setEditing(null); setForm(EMPTY_FORM); setAreasInput(''); setShowForm(true); }}
          className="flex items-center gap-1 bg-stone-900 text-white text-xs font-bold px-3 py-2 rounded-full"
        >
          <Plus className="w-3.5 h-3.5" /> 新增
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <form onSubmit={handleSubmit} className="w-full bg-white rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto space-y-3">
            <h2 className="text-sm font-bold text-stone-800 mb-2">{editing ? '編輯卡片' : '新增卡片'}</h2>

            <div>
              <label className="text-xs text-stone-500 mb-1 block">所屬模塊 *</label>
              <select value={form.section_key} onChange={e => setForm(f => ({ ...f, section_key: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm">
                {Object.entries(SECTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Emoji 圖示</label>
                <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm" placeholder="🧹" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">標籤（選填）</label>
                <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm" placeholder="熱門" />
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-500 mb-1 block">服務標題 *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm" placeholder="冷氣清洗" />
            </div>

            <div>
              <label className="text-xs text-stone-500 mb-1 block">副標題（簡短描述）</label>
              <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm" placeholder="濾網、蒸發器深層除菌" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">起始價格（NT$）</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm" placeholder="1200" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">排序（越小越前）</label>
                <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-500 mb-1 block">服務地區（用逗號分隔）</label>
              <input value={areasInput} onChange={e => setAreasInput(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm" placeholder="台北市、新北市、板橋區" />
            </div>

            <div>
              <label className="text-xs text-stone-500 mb-1 block">圖片 URL（選填）</label>
              <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm" placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">緯度（選填）</label>
                <input type="number" step="any" value={form.gps_lat} onChange={e => setForm(f => ({ ...f, gps_lat: e.target.value }))}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm" placeholder="25.033" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">經度（選填）</label>
                <input type="number" step="any" value={form.gps_lng} onChange={e => setForm(f => ({ ...f, gps_lng: e.target.value }))}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm" placeholder="121.565" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="is_active" checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
              <label htmlFor="is_active" className="text-sm text-stone-700">立即上架顯示</label>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                className="flex-1 border border-stone-200 text-stone-700 text-sm font-bold py-2.5 rounded-xl">取消</button>
              <button type="submit" disabled={save.isPending}
                className="flex-1 bg-stone-900 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-50">
                {save.isPending ? '儲存中...' : '儲存'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="px-4 pt-4 space-y-4">
        {Object.entries(SECTION_LABELS).map(([key, label]) => {
          const sectionItems = grouped[key] || [];
          return (
            <div key={key}>
              <p className="text-xs font-bold text-stone-500 mb-2">{label}</p>
              {sectionItems.length === 0 ? (
                <p className="text-xs text-stone-300 mb-2">尚無內容</p>
              ) : (
                <div className="space-y-2">
                  {sectionItems.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl p-3 flex items-center gap-3 border border-stone-100">
                      <span className="text-2xl">{item.emoji || '🧹'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-stone-800 truncate">{item.title}</p>
                        <p className="text-xs text-stone-400 truncate">{item.subtitle}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.price && <span className="text-xs font-bold text-stone-700">NT${item.price.toLocaleString()}</span>}
                          {(item.service_areas || []).length > 0 && (
                            <span className="text-[10px] text-stone-400">{item.service_areas.slice(0, 2).join('・')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => toggle.mutate({ id: item.id, is_active: !item.is_active })}>
                          {item.is_active
                            ? <ToggleRight className="w-5 h-5 text-green-500" />
                            : <ToggleLeft className="w-5 h-5 text-stone-300" />}
                        </button>
                        <button onClick={() => openEdit(item)}><Pencil className="w-4 h-4 text-stone-400" /></button>
                        <button onClick={() => remove.mutate(item.id)}><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}