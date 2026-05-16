import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, User, Home, ShoppingBag, Calendar, LogOut, Edit2, ChevronRight, HelpCircle, MessageSquare, Shield, Phone, FileText, LayoutDashboard, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function ClientProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
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

  const { data: clientProfile, isLoading } = useQuery({
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

  const profile = clientProfile?.[0];

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) {
        return base44.entities.ClientProfile.update(profile.id, data);
      } else {
        return base44.entities.ClientProfile.create({ ...data, user_id: user?.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile'] });
      toast.success("資料已更新");
      setEditMode(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayName = user?.full_name || '訪客';
  const avatarLetter = displayName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 黑色頭像區 */}
      <div className="bg-black pt-10 pb-6 px-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-stone-700 flex items-center justify-center border-2 border-white/20">
            <span className="text-2xl font-bold text-white">{avatarLetter}</span>
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">{displayName}</p>
            <p className="text-white/40 text-sm">{user?.email}</p>
          </div>
          <button
            onClick={() => navigate('/ClientProfileEdit')}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Edit2 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* 訂閱方案統計 */}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-base font-bold">{profile?.subscription_plan || '—'}</p>
            <p className="text-white/40 text-xs">目前方案</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-base font-bold">{profile?.remaining_visits ?? '—'}</p>
            <p className="text-white/40 text-xs">剩餘次數</p>
          </div>
        </div>
      </div>

      {/* 內容區 */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="p-4 space-y-2">

          {/* 居家資訊 */}
          <div className="bg-white rounded-xl overflow-hidden border border-stone-100">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">居家資訊</p>
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-xs text-stone-500 hover:text-stone-800 transition-colors font-medium"
              >
                {editMode ? '取消' : '編輯'}
              </button>
            </div>

            {editMode ? (
              <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3">
                <div>
                  <Label className="text-xs text-stone-500 mb-1 block">聯絡電話</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912-345-678"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-stone-500 mb-1 block">服務地址</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="完整服務地址"
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-stone-500 mb-1 block">房屋類型</Label>
                    <Input
                      value={formData.housing_type}
                      onChange={(e) => setFormData({ ...formData, housing_type: e.target.value })}
                      placeholder="公寓、大樓..."
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500 mb-1 block">坪數</Label>
                    <Input
                      type="number"
                      value={formData.square_footage}
                      onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
                      placeholder="30"
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-stone-500 mb-1 block">家庭成員</Label>
                  <Input
                    value={formData.family_members}
                    onChange={(e) => setFormData({ ...formData, family_members: e.target.value })}
                    placeholder="例：2 大 1 小"
                    className="rounded-xl"
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <Label className="text-sm text-stone-700 cursor-pointer">有寵物</Label>
                  <Switch
                    checked={formData.has_pets}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_pets: checked })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="w-full bg-black text-white py-3 rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                >
                  {saveMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />儲存中...</>
                  ) : (
                    <><Save className="w-4 h-4" />儲存資料</>
                  )}
                </button>
              </form>
            ) : (
              <div className="border-t border-stone-50">
                {[
                  { label: '聯絡電話', value: formData.phone || '尚未填寫' },
                  { label: '服務地址', value: formData.address || '尚未填寫' },
                  { label: '房屋類型', value: formData.housing_type || '尚未填寫' },
                  { label: '坪數', value: formData.square_footage ? `${formData.square_footage} 坪` : '尚未填寫' },
                  { label: '家庭成員', value: formData.family_members || '尚未填寫' },
                  { label: '有寵物', value: formData.has_pets ? '是' : '否' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-stone-50 last:border-0">
                    <span className="text-sm text-stone-400">{label}</span>
                    <span className="text-sm font-medium text-stone-800">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 快速連結 */}
          <div className="bg-white rounded-xl overflow-hidden border border-stone-100">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">快速連結</p>
            {[
              { icon: Calendar, label: '我的預約', desc: '查看即將到來的服務', to: '/MyBookings' },
              { icon: FileText, label: '服務紀錄', desc: '過往清潔紀錄與報告', to: '/ClientHistory' },
            ].map(({ icon: Icon, label, desc, to }) => (
              <button key={label} onClick={() => navigate(to)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors border-t border-stone-50">
                <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-stone-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-stone-800">{label}</p>
                  <p className="text-xs text-stone-400">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-300" />
              </button>
            ))}
          </div>

          {/* 幫助 & 支援 */}
          <div className="bg-white rounded-xl overflow-hidden border border-stone-100">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">幫助 & 支援</p>
            {[
              { icon: HelpCircle, label: '常見問題（FAQ）', to: '/FAQ' },
              { icon: MessageSquare, label: '聯絡客服' },
              { icon: Phone, label: '緊急聯絡電話' },
              { icon: Shield, label: '隱私政策', to: '/PrivacyPolicy' },
            ].map(({ icon: Icon, label, to }) => (
              <button key={label} onClick={() => to && navigate(to)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors border-t border-stone-50">
                <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-stone-600" />
                </div>
                <span className="flex-1 text-sm font-medium text-stone-800 text-left">{label}</span>
                <ChevronRight className="w-4 h-4 text-stone-300" />
              </button>
            ))}
          </div>

          {/* 台端切換（僅 admin 或 cleaner 可見） */}
          {(user?.role === 'admin' || user?.role === 'cleaner') && (
            <div className="bg-white rounded-xl overflow-hidden border border-gold-200">
              <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gold-600 uppercase tracking-wider">台端切換</p>
              {[
                ...(user?.role === 'admin' ? [
                  { icon: LayoutDashboard, label: '後台管理', desc: '訂單、派案、報表', to: '/AdminDashboard' },
                ] : []),
                { icon: Zap, label: '中台（清潔師）', desc: '任務地圖、接單管理', to: '/CleanerJobs' },
              ].map(({ icon: Icon, label, desc, to }) => (
                <button key={label} onClick={() => navigate(to)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gold-50 transition-colors border-t border-stone-50">
                  <div className="w-9 h-9 rounded-lg bg-gold-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gold-700" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-stone-800">{label}</p>
                    <p className="text-xs text-stone-400">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gold-400" />
                </button>
              ))}
            </div>
          )}

          {/* 登出 */}
          <button onClick={() => base44.auth.logout()}
            className="w-full bg-white rounded-xl p-4 flex items-center gap-3 border border-stone-100 hover:bg-stone-50 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-stone-500" />
            </div>
            <span className="text-sm font-medium text-stone-600">登出</span>
          </button>

        </div>
      </div>

      <ClientBottomNav />
    </div>
  );
}