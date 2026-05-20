import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Camera, Save, Loader2, LogOut, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const SERVICE_OPTIONS = ['居家清潔', '家電清洗', '布面清洗', '整理收納', '商業清潔', '裝潢清潔'];

export default function DashboardProfile({ user, profile, navigate }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nickname: '', profile_photo: '', bio: '',
    service_types: [], experience_years: '',
    expected_hourly_rate: '', residence_area: '',
    pet_acceptance: false, has_own_tools: false,
    is_active: false,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        nickname: profile.nickname || '',
        profile_photo: profile.profile_photo || '',
        bio: profile.bio || '',
        service_types: profile.service_types || [],
        experience_years: profile.experience_years || '',
        expected_hourly_rate: profile.expected_hourly_rate || '',
        residence_area: profile.residence_area || '',
        pet_acceptance: profile.pet_acceptance || false,
        has_own_tools: profile.has_own_tools || false,
        is_active: profile.is_active || false,
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (data) => profile
      ? base44.entities.CleanerProfile.update(profile.id, data)
      : base44.entities.CleanerProfile.create({ ...data, user_id: user.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cleanerProfile-dashboard'] });
      toast.success('個人資料已更新');
    },
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, profile_photo: file_url }));
    setUploading(false);
  };

  const toggleService = (svc) => {
    setForm(f => ({
      ...f,
      service_types: f.service_types.includes(svc)
        ? f.service_types.filter(s => s !== svc)
        : [...f.service_types, svc],
    }));
  };

  return (
    <div>
      <div className="sticky top-0 z-30 bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between">
        <h1 className="text-sm font-bold text-stone-800">個人設定</h1>
        <button
          onClick={() => navigate(`/CleanerShopPage?cleaner=${user.id}`)}
          className="flex items-center gap-1 text-xs text-stone-500"
        >
          預覽頁面 <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div className="p-4 space-y-4">

        {/* 頭像 */}
        <div className="flex flex-col items-center py-4">
          <label className="relative cursor-pointer">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-stone-200 bg-stone-100">
              {form.profile_photo
                ? <img src={form.profile_photo} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-3xl">🧹</div>
              }
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-stone-900 rounded-full flex items-center justify-center border-2 border-white">
              {uploading ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <Camera className="w-3 h-3 text-white" />}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
          <p className="text-xs text-stone-400 mt-2">點擊更換頭像</p>
        </div>

        {/* 接案狀態 */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-800">接案狀態</p>
            <p className="text-[11px] text-stone-400">{form.is_active ? '目前開放接案' : '目前暫停接案'}</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
            className={`w-12 h-6 rounded-full relative transition-colors ${form.is_active ? 'bg-green-500' : 'bg-stone-200'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* 基本資訊 */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
          <p className="text-xs font-bold text-stone-600">基本資訊</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">顯示名稱</Label>
              <Input value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                placeholder="林師傅" className="rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">居住地區</Label>
              <Input value={form.residence_area} onChange={e => setForm(f => ({ ...f, residence_area: e.target.value }))}
                placeholder="台北市大安區" className="rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">年資（年）</Label>
              <Input type="number" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))}
                placeholder="3" className="rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">期望時薪（NT$）</Label>
              <Input type="number" value={form.expected_hourly_rate} onChange={e => setForm(f => ({ ...f, expected_hourly_rate: e.target.value }))}
                placeholder="350" className="rounded-xl text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">自我介紹</Label>
            <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="介紹你的服務特色…" rows={3} className="rounded-xl text-sm resize-none" />
          </div>
        </div>

        {/* 服務項目 */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4">
          <p className="text-xs font-bold text-stone-600 mb-3">服務項目</p>
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map(svc => (
              <button key={svc} type="button" onClick={() => toggleService(svc)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  form.service_types.includes(svc) ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'
                }`}
              >{svc}</button>
            ))}
          </div>
        </div>

        {/* 偏好 */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
          <p className="text-xs font-bold text-stone-600">偏好設定</p>
          {[
            { key: 'pet_acceptance', label: '可接受寵物家庭' },
            { key: 'has_own_tools', label: '自備清潔工具' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <p className="text-sm text-stone-700">{label}</p>
              <button onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                className={`w-12 h-6 rounded-full relative transition-colors ${form[key] ? 'bg-stone-900' : 'bg-stone-200'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[key] ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* 儲存 */}
        <button
          onClick={() => saveMutation.mutate({ ...form, experience_years: form.experience_years ? Number(form.experience_years) : null, expected_hourly_rate: form.expected_hourly_rate ? Number(form.expected_hourly_rate) : null })}
          disabled={saveMutation.isPending}
          className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          儲存設定
        </button>

        {/* 登出 */}
        <button
          onClick={() => base44.auth.logout()}
          className="w-full flex items-center justify-center gap-2 border border-stone-200 text-stone-500 text-sm py-3.5 rounded-2xl"
        >
          <LogOut className="w-4 h-4" />登出
        </button>
      </div>
    </div>
  );
}