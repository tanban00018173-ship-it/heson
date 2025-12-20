import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ClientProfile() {
  const [user, setUser] = useState(null);
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
      const profile = clientProfile[0];
      setFormData({
        phone: profile.phone || '',
        address: profile.address || '',
        housing_type: profile.housing_type || '',
        square_footage: profile.square_footage || '',
        family_members: profile.family_members || '',
        has_pets: profile.has_pets || false,
      });
    }
  }, [clientProfile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const profile = clientProfile?.[0];
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
    onError: () => {
      toast.error("更新失敗，請稍後再試");
    }
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

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <div className="hidden lg:block">
        <Sidebar userRole="client" userName={user?.full_name} />
      </div>
      <MobileNav userRole="client" userName={user?.full_name} />
      
      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-stone-800">個人資料</h1>
            <p className="text-stone-500 mt-1">更新您的聯絡資訊與居家資料</p>
          </div>

          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="mb-6 shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-stone-800">{user?.full_name || '訪客'}</h2>
                    <p className="text-stone-500">{user?.email}</p>
                  </div>
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
                <CardTitle className="text-lg">居家資訊</CardTitle>
                <CardDescription>
                  這些資訊將幫助我們為您提供更貼心的服務
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Phone */}
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

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">服務地址</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="請輸入完整地址"
                      className="rounded-xl"
                    />
                  </div>

                  {/* Housing Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>房屋類型</Label>
                      <Select 
                        value={formData.housing_type} 
                        onValueChange={(v) => setFormData({ ...formData, housing_type: v })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="請選擇" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="透天">透天厝</SelectItem>
                          <SelectItem value="公寓">公寓</SelectItem>
                          <SelectItem value="大樓">大樓</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sqft">坪數</Label>
                      <Input
                        id="sqft"
                        type="number"
                        value={formData.square_footage}
                        onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
                        placeholder="例：30"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Family Members */}
                  <div className="space-y-2">
                    <Label htmlFor="family">家庭成員</Label>
                    <Input
                      id="family"
                      value={formData.family_members}
                      onChange={(e) => setFormData({ ...formData, family_members: e.target.value })}
                      placeholder="例：2大1小"
                      className="rounded-xl"
                    />
                  </div>

                  {/* Pets */}
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                    <div>
                      <Label htmlFor="pets" className="cursor-pointer">是否有寵物</Label>
                      <p className="text-sm text-stone-500 mt-1">
                        我們的管理師都經過寵物友善訓練
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
        </div>
      </main>
    </div>
  );
}