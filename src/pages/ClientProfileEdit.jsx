import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Check, ArrowLeft, User, Home, Settings, Lock } from "lucide-react";
import { toast } from "sonner";

// ─── 設定分類 ───────────────────────────────────────────
const SECTIONS = ['profile', 'settings', 'account'];
const SECTION_LABELS = { profile: '我的檔案', settings: '我的設定', account: '我的帳號' };
const SECTION_ICONS = { profile: User, settings: Settings, account: Lock };

export default function ClientProfileEdit() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('profile');
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    housing_type: '',
    square_footage: '',
    family_members: '',
    has_pets: false,
  });

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: clientProfile } = useQuery({
    queryKey: ['clientProfile', user?.id],
    queryFn: () => base44.entities.ClientProfile.filter({ user_id: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  useEffect(() => {
    if (clientProfile?.[0]) {
      const p = clientProfile[0];
      setFormData({
        phone: p.phone || '',
        address: p.address || '',
        housing_type: p.housing_type || '',
        square_footage: p.square_footage || '',
        family_members: p.family_members || '',
        has_pets: p.has_pets || false,
      });
    }
  }, [clientProfile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const profile = clientProfile?.[0];
      if (profile) return base44.entities.ClientProfile.update(profile.id, data);
      return base44.entities.ClientProfile.create({ ...data, user_id: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile'] });
      toast.success("資料已更新");
    },
  });

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col">
      {/* 頂部導航 */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center sticky top-0 z-20">
        <button onClick={() => navigate('/ClientProfile')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors mr-2">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-stone-900 -ml-9">設定</h1>
      </div>

      {/* 分類 Tab */}
      <div className="flex gap-2 px-4 pt-4 pb-2">
        {SECTIONS.map((s) => {
          const Icon = SECTION_ICONS[s];
          const active = activeSection === s;
          return (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-semibold transition-colors ${
                active ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 border border-stone-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {SECTION_LABELS[s]}
            </button>
          );
        })}
      </div>

      {/* 內容區 */}
      <div className="flex-1 px-4 pt-2 pb-32 space-y-3">

        {/* ── 我的檔案 ── */}
        {activeSection === 'profile' && (
          <>
            <div className="bg-white rounded-2xl overflow-hidden">
              <p className="px-4 pt-4 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">帳戶資訊</p>
              <div className="divide-y divide-stone-50">
                <div className="px-4 py-3">
                  <p className="text-xs text-stone-400 mb-1">姓名</p>
                  <p className="text-sm font-medium text-stone-800">{user?.full_name || '—'}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-stone-400 mb-1">電子郵件</p>
                  <p className="text-sm font-medium text-stone-800">{user?.email || '—'}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-stone-400 mb-1.5">聯絡電話</p>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912-345-678"
                    className="border border-stone-200 rounded-xl text-sm h-9"
                  />
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-stone-400 mb-1.5">服務地址</p>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="請輸入完整地址"
                    className="border border-stone-200 rounded-xl text-sm h-9"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending}
              className="w-full bg-stone-900 hover:bg-stone-700 text-white font-bold py-5 rounded-2xl"
            >
              {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-4 h-4 mr-2" />儲存檔案</>}
            </Button>
          </>
        )}

        {/* ── 我的設定 ── */}
        {activeSection === 'settings' && (
          <>
            <div className="bg-white rounded-2xl overflow-hidden">
              <p className="px-4 pt-4 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">居家資訊</p>
              <div className="divide-y divide-stone-50">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <p className="text-xs text-stone-400 mb-1.5">房屋類型</p>
                    <Select value={formData.housing_type} onValueChange={(v) => setFormData({ ...formData, housing_type: v })}>
                      <SelectTrigger className="border border-stone-200 rounded-xl text-sm h-9">
                        <SelectValue placeholder="請選擇" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="透天">透天厝</SelectItem>
                        <SelectItem value="公寓">公寓</SelectItem>
                        <SelectItem value="大樓">大樓</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-stone-400 mb-1.5">坪數</p>
                    <Input
                      type="number"
                      value={formData.square_footage}
                      onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
                      placeholder="例：30"
                      className="border border-stone-200 rounded-xl text-sm h-9"
                    />
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-stone-400 mb-1.5">家庭成員</p>
                  <Input
                    value={formData.family_members}
                    onChange={(e) => setFormData({ ...formData, family_members: e.target.value })}
                    placeholder="例：2 大 1 小"
                    className="border border-stone-200 rounded-xl text-sm h-9"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-stone-800">有寵物</p>
                    <p className="text-xs text-stone-400 mt-0.5">管理師均接受寵物友善訓練</p>
                  </div>
                  <Switch
                    checked={formData.has_pets}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_pets: checked })}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending}
              className="w-full bg-stone-900 hover:bg-stone-700 text-white font-bold py-5 rounded-2xl"
            >
              {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-4 h-4 mr-2" />儲存設定</>}
            </Button>
          </>
        )}

        {/* ── 我的帳號 ── */}
        {activeSection === 'account' && (
          <div className="bg-white rounded-2xl overflow-hidden">
            <p className="px-4 pt-4 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">帳號管理</p>
            <div className="divide-y divide-stone-50">
              <div className="px-4 py-4">
                <p className="text-sm font-medium text-stone-800">角色</p>
                <p className="text-xs text-stone-400 mt-0.5">{user?.role || '一般用戶'}</p>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm font-medium text-stone-800">帳號 ID</p>
                <p className="text-xs text-stone-400 mt-0.5 font-mono">{user?.id?.slice(0, 16) || '—'}...</p>
              </div>
              <button
                onClick={() => base44.auth.logout()}
                className="w-full flex items-center px-4 py-4 text-left hover:bg-red-50 transition-colors"
              >
                <p className="text-sm font-medium text-red-500">登出帳號</p>
              </button>
            </div>
          </div>
        )}
      </div>

      <ClientBottomNav />
    </div>
  );
}