import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Camera, Save, Loader2, ArrowLeft, Star, Shield, CheckCircle, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const SERVICE_OPTIONS = ['居家清潔', '家電清洗', '布面清洗', '整理收納', '商業清潔', '裝潢清潔'];

export default function CleanerStorefront() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState('');
  const [form, setForm] = useState({
    nickname: '',
    profile_photo: '',
    bio: '',
    service_types: [],
    experience_years: '',
    expected_hourly_rate: '',
    residence_area: '',
    pet_acceptance: false,
    has_own_tools: false,
    transportation: '',
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) { base44.auth.redirectToLogin(); return; }
      base44.auth.me().then(setUser);
    });
  }, []);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['cleanerProfile-storefront', user?.id],
    queryFn: () => base44.entities.CleanerProfile.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const profile = profiles[0];

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
        transportation: profile.transportation || '',
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      profile
        ? base44.entities.CleanerProfile.update(profile.id, data)
        : base44.entities.CleanerProfile.create({ ...data, user_id: user.id, is_active: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cleanerProfile-storefront'] });
      toast.success('門市資料已更新！');
    },
  });

  const handleUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, [field]: file_url }));
    setUploading('');
    toast.success('上傳成功');
  };

  const toggleService = (svc) => {
    setForm(f => ({
      ...f,
      service_types: f.service_types.includes(svc)
        ? f.service_types.filter(s => s !== svc)
        : [...f.service_types, svc],
    }));
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-stone-800">我的師傅頁</h1>
          <p className="text-[11px] text-stone-400">客戶會看到此頁面</p>
        </div>
        {profile?.is_active ? (
          <Badge className="bg-green-100 text-green-700 text-[11px]">
            <CheckCircle className="w-3 h-3 mr-1" />上架中
          </Badge>
        ) : (
          <Badge className="bg-yellow-100 text-yellow-700 text-[11px]">待審核</Badge>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">

        {/* Preview card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100">
          {/* Cover photo */}
          <div className="relative h-36 bg-gradient-to-br from-stone-200 to-stone-300">
            {form.profile_photo && (
              <img src={form.profile_photo} alt="cover" className="w-full h-full object-cover" />
            )}
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/30 transition-colors group">
              <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'profile_photo')} />
              <div className="flex flex-col items-center gap-1 text-white">
                {uploading === 'profile_photo' ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-7 h-7 drop-shadow" />
                    <span className="text-xs font-semibold drop-shadow">更換照片</span>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Profile info preview */}
          <div className="px-5 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-stone-800 text-base">{form.nickname || user.full_name || '管理師'}</p>
                <p className="text-xs text-stone-400 mt-0.5">{form.residence_area || '服務地區'}</p>
              </div>
              <div className="flex gap-1.5">
                {profile?.police_record_verified && (
                  <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" />良民證
                  </span>
                )}
                {form.experience_years && (
                  <span className="bg-amber-50 text-amber-600 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {form.experience_years}年資歷
                  </span>
                )}
              </div>
            </div>
            {form.bio && <p className="text-xs text-stone-500 mt-2 leading-relaxed">{form.bio}</p>}
            {form.service_types.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {form.service_types.map(s => (
                  <span key={s} className="bg-stone-100 text-stone-600 text-[11px] px-2.5 py-0.5 rounded-full font-medium">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm space-y-5">
          <p className="text-sm font-bold text-stone-700">基本資訊</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">顯示名稱</Label>
              <Input value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                placeholder="例：林師傅" className="rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">居住地區</Label>
              <Input value={form.residence_area} onChange={e => setForm(f => ({ ...f, residence_area: e.target.value }))}
                placeholder="例：台北市大安區" className="rounded-xl text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <Textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="介紹你的服務特色、工作態度、擅長項目…"
              rows={3}
              className="rounded-xl text-sm resize-none"
            />
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm">
          <p className="text-sm font-bold text-stone-700 mb-3">服務項目</p>
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map(svc => (
              <button
                key={svc}
                type="button"
                onClick={() => toggleService(svc)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  form.service_types.includes(svc)
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                {svc}
              </button>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm space-y-3">
          <p className="text-sm font-bold text-stone-700 mb-1">服務偏好</p>

          {[
            { key: 'pet_acceptance', label: '可接受寵物家庭', sub: '家中有貓狗等寵物的客戶' },
            { key: 'has_own_tools', label: '自備清潔工具', sub: '攜帶專業清潔用具到府' },
          ].map(({ key, label, sub }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl">
              <div>
                <p className="text-sm font-medium text-stone-700">{label}</p>
                <p className="text-[11px] text-stone-400">{sub}</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${form[key] ? 'bg-stone-900' : 'bg-stone-200'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[key] ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Save */}
        <Button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          className="w-full bg-stone-900 hover:bg-stone-700 text-white py-6 rounded-2xl text-sm font-bold"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          儲存師傅頁
        </Button>
      </div>
    </div>
  );
}