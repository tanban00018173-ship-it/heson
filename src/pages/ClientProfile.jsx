import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from "react-router-dom";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, User, Home, X, ShoppingBag, Calendar, LogOut, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";

export default function ClientProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
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
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayName = user?.full_name || '訪客';
  const avatarLetter = displayName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 漢堡菜單按鈕 (mobile only) */}
      <button
        onClick={() => setMenuOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-30 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
      >
        <User className="w-5 h-5 text-stone-700" />
      </button>

      {/* 漢堡菜單 Portal */}
      {menuOpen && createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.35)' }}
            onClick={() => setMenuOpen(false)}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100000,
            width: '280px', background: '#fff',
            boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* 頭像區 */}
            <div className="flex items-center gap-4 p-6 bg-black border-b border-stone-800">
              <div className="w-14 h-14 rounded-full bg-stone-700 border-2 border-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <span className="text-xl font-bold text-white">{avatarLetter}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{displayName}</p>
                <p className="text-xs text-white/40 mt-0.5 truncate">{user?.email}</p>
              </div>
              <button onClick={() => setMenuOpen(false)} className="text-white/40 hover:text-white flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 選單項目 */}
            <nav className="flex-1 p-4 space-y-1">
              {[
                { to: 'Home', icon: Home, label: '首頁' },
                { to: 'ClientShop', icon: ShoppingBag, label: '商店' },
                { to: 'MyBookings', icon: Calendar, label: '我的訂單' },
                { to: 'ClientProfile', icon: User, label: '個人資料', active: true },
              ].map(({ to, icon: Icon, label, active }) => (
                <Link
                  key={to}
                  to={createPageUrl(to)}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                    active ? 'bg-stone-100 text-black font-semibold' : 'text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${active ? 'bg-black' : 'bg-stone-100'}`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-stone-500'}`} />
                  </div>
                  {label}
                </Link>
              ))}
            </nav>

            {/* 登出 */}
            <div className="p-4 border-t border-stone-100">
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-stone-500 hover:bg-stone-50 w-full transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-stone-500" />
                </div>
                登出
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      <main className="pt-0 pb-28">
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-stone-800">個人資料</h1>
            <p className="text-stone-500 mt-1">管理您的帳戶資訊</p>
          </div>

          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="mb-6 shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-stone-800">{displayName}</h2>
                      <p className="text-stone-500">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    onClick={() => navigate('/ClientProfileEdit')}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">聯絡資訊</CardTitle>
                <CardDescription>
                  更新您的聯絡方式與服務地址
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">聯絡電話</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0912-345-678"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="housing_type">房屋類型</Label>
                      <Input
                        id="housing_type"
                        value={formData.housing_type}
                        onChange={(e) => setFormData({ ...formData, housing_type: e.target.value })}
                        placeholder="例：公寓、大樓、透天"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">服務地址</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="完整服務地址"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="square_footage">坪數</Label>
                      <Input
                        id="square_footage"
                        type="number"
                        value={formData.square_footage}
                        onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
                        placeholder="例：30"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="family_members">家庭成員</Label>
                      <Input
                        id="family_members"
                        value={formData.family_members}
                        onChange={(e) => setFormData({ ...formData, family_members: e.target.value })}
                        placeholder="例：2 大 1 小"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Switches */}
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                    <div>
                      <Label htmlFor="pets" className="cursor-pointer">有寵物</Label>
                      <p className="text-sm text-stone-500 mt-1">
                        家中飼養寵物
                      </p>
                    </div>
                    <Switch
                      id="pets"
                      checked={formData.has_pets}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_pets: checked })}
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="w-full bg-stone-800 hover:bg-stone-900 text-white py-6 rounded-xl text-base"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        儲存中...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        儲存資料
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscription Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6"
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">訂閱資訊</CardTitle>
                <CardDescription>
                  查看您的方案與剩餘次數
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 rounded-xl">
                    <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-1">目前方案</p>
                    <p className="font-headline font-bold text-stone-900 text-base">
                      {profile?.subscription_plan || '無'}
                    </p>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-xl">
                    <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-1">剩餘次數</p>
                    <p className="font-headline font-bold text-stone-900 text-base">
                      {profile?.remaining_visits ?? 0} 次
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <ClientBottomNav />
    </div>
  );
}