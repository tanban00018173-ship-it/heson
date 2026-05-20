import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

function ServiceForm({ user, item, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: item?.title || '',
    subtitle: item?.subtitle || '',
    price: item?.price || '',
    badge: item?.badge || '',
    section_key: item?.section_key || 'featured_cleaners',
    image_url: item?.image_url || '',
  });
  const [uploading, setUploading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data) => item
      ? base44.entities.HomeSection.update(item.id, data)
      : base44.entities.HomeSection.create({
          ...data,
          provider_id: user.id,
          provider_type: 'cleaner',
          is_active: true,
          sort_order: 99,
        }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cleanerServices'] });
      toast.success(item ? '服務已更新' : '服務已上架');
      onClose();
    },
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
    toast.success('圖片上傳成功');
  };

  const SECTION_OPTS = [
    { value: 'featured_cleaners', label: '口碑好評' },
    { value: 'deep_clean', label: '細清／大掃除' },
    { value: 'recurring', label: '定期包月' },
    { value: 'appliance', label: '家電清洗' },
    { value: 'fabric', label: '布面清洗' },
    { value: 'organize', label: '整理收納' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-white w-full max-h-[90vh] overflow-y-auto rounded-t-3xl p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-base text-stone-800">{item ? '編輯服務' : '新增服務'}</h2>
          <button onClick={onClose} className="text-stone-400 text-sm">取消</button>
        </div>

        {/* 圖片上傳 */}
        <div>
          <Label className="text-xs">服務圖片</Label>
          <label className="mt-1.5 block w-full h-32 rounded-2xl border-2 border-dashed border-stone-200 overflow-hidden cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            {uploading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
              </div>
            ) : form.image_url ? (
              <img src={form.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-stone-400">
                <span className="text-2xl">📷</span>
                <span className="text-xs">點擊上傳圖片</span>
              </div>
            )}
          </label>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">服務名稱 *</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="例：全室深度清潔" className="rounded-xl text-sm" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">服務說明</Label>
          <Textarea value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
            placeholder="描述服務內容…" rows={2} className="rounded-xl text-sm resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">起始價格 (NT$)</Label>
            <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="2500" className="rounded-xl text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">標籤（選填）</Label>
            <Input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
              placeholder="熱門" className="rounded-xl text-sm" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">服務分類</Label>
          <select
            value={form.section_key}
            onChange={e => setForm(f => ({ ...f, section_key: e.target.value }))}
            className="w-full rounded-xl border border-stone-200 text-sm px-3 py-2"
          >
            {SECTION_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <button
          disabled={!form.title || saveMutation.isPending}
          onClick={() => saveMutation.mutate({ ...form, price: form.price ? Number(form.price) : null })}
          className="w-full bg-stone-900 text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (item ? '更新服務' : '上架服務')}
        </button>
      </div>
    </div>
  );
}

export default function DashboardServices({ user, services }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HomeSection.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cleanerServices'] }); toast.success('已刪除'); },
  });
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.HomeSection.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cleanerServices'] }),
  });

  return (
    <div>
      <div className="sticky top-0 z-30 bg-white border-b border-stone-100 px-4 py-3 flex items-center">
        <h1 className="text-sm font-bold text-stone-800 flex-1">我的服務</h1>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-stone-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl"
        >
          <Plus className="w-3.5 h-3.5" />新增
        </button>
      </div>

      <div className="p-4 space-y-3">
        {services.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl">🛎️</span>
            <p className="text-sm text-stone-400 mt-3">尚未上架任何服務</p>
            <button
              onClick={() => { setEditItem(null); setShowForm(true); }}
              className="mt-4 bg-stone-900 text-white text-xs font-bold px-5 py-2.5 rounded-full"
            >+ 新增第一個服務</button>
          </div>
        ) : (
          services.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden flex gap-3 p-3">
              <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
                {s.image_url
                  ? <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl">🧹</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className="font-semibold text-sm text-stone-800 truncate">{s.title}</p>
                  <button onClick={() => toggleMutation.mutate({ id: s.id, is_active: !s.is_active })} className="flex-shrink-0">
                    {s.is_active
                      ? <ToggleRight className="w-5 h-5 text-green-500" />
                      : <ToggleLeft className="w-5 h-5 text-stone-300" />
                    }
                  </button>
                </div>
                {s.subtitle && <p className="text-[11px] text-stone-400 truncate">{s.subtitle}</p>}
                {s.price && <p className="text-xs font-bold text-stone-900 mt-0.5">NT$ {s.price.toLocaleString()} 起</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    onClick={() => { setEditItem(s); setShowForm(true); }}
                    className="flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full"
                  >
                    <Pencil className="w-3 h-3" />編輯
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(s.id)}
                    className="flex items-center gap-1 text-[11px] text-red-400 bg-red-50 px-2.5 py-1 rounded-full"
                  >
                    <Trash2 className="w-3 h-3" />刪除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <ServiceForm
          user={user}
          item={editItem}
          onClose={() => { setShowForm(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}