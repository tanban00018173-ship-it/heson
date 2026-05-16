import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ClientProfileEdit() {
  const navigate = useNavigate();
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
  const [originalData, setOriginalData] = useState(null);

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
      const data = {
        phone: p.phone || '',
        address: p.address || '',
        housing_type: p.housing_type || '',
        square_footage: p.square_footage || '',
        family_members: p.family_members || '',
        has_pets: p.has_pets || false,
      };
      setFormData(data);
      setOriginalData(data);
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
      navigate('/ClientProfile');
    },
  });

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  return (
    <div className="min-h-screen bg-[#f6f9ff] flex font-body">
      <div className="hidden lg:block"><Sidebar userRole="client" userName={user?.full_name} /></div>
      <MobileNav userRole="client" userName={user?.full_name} />

      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-2xl mx-auto pb-28">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/ClientProfile')}
              className="text-stone-600 hover:bg-stone-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 font-headline">編輯資訊</p>
              <h1 className="text-2xl font-headline font-extrabold tracking-tight text-stone-900">修改個人資料</h1>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="bg-white rounded-3xl border border-[#e8eef6] p-6 mb-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-5">帳戶資訊</p>
              <div className="space-y-4">
                <div className="p-4 bg-[#eef4fc] rounded-2xl">
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-2">聯絡電話</p>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912-345-678"
                    className="border-0 bg-transparent p-0 h-auto font-semibold text-stone-900 placeholder:text-stone-300 focus-visible:ring-0 text-sm"
                  />
                </div>
                <div className="p-4 bg-[#eef4fc] rounded-2xl">
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-2">服務地址</p>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="請輸入完整地址"
                    className="border-0 bg-transparent p-0 h-auto font-semibold text-stone-900 placeholder:text-stone-300 focus-visible:ring-0 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#e8eef6] p-6 mb-6">
              <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-5">居家資訊</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-[#eef4fc] rounded-2xl">
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-2">房屋類型</p>
                    <Select value={formData.housing_type} onValueChange={(v) => setFormData({ ...formData, housing_type: v })}>
                      <SelectTrigger className="border-0 bg-transparent p-0 h-auto font-semibold text-stone-900 text-sm focus:ring-0">
                        <SelectValue placeholder="請選擇" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="透天">透天厝</SelectItem>
                        <SelectItem value="公寓">公寓</SelectItem>
                        <SelectItem value="大樓">大樓</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-[#eef4fc] rounded-2xl">
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-2">坪數</p>
                    <Input
                      type="number"
                      value={formData.square_footage}
                      onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
                      placeholder="例：30"
                      className="border-0 bg-transparent p-0 h-auto font-semibold text-stone-900 placeholder:text-stone-300 focus-visible:ring-0 text-sm"
                    />
                  </div>
                </div>
                <div className="p-4 bg-[#eef4fc] rounded-2xl">
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-2">家庭成員</p>
                  <Input
                    value={formData.family_members}
                    onChange={(e) => setFormData({ ...formData, family_members: e.target.value })}
                    placeholder="例：2 大 1 小"
                    className="border-0 bg-transparent p-0 h-auto font-semibold text-stone-900 placeholder:text-stone-300 focus-visible:ring-0 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-[#eef4fc] rounded-2xl">
                  <div>
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">有寵物</p>
                    <p className="text-sm text-stone-500 mt-0.5">管理師均接受寵物友善訓練</p>
                  </div>
                  <Switch
                    checked={formData.has_pets}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_pets: checked })}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending || !hasChanges}
                className="flex-1 bg-[#131b2e] hover:bg-[#1a2438] text-white font-headline font-bold py-6 rounded-2xl disabled:opacity-50"
              >
                {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 mr-2" />儲存變更</>}
              </Button>
              <Button
                onClick={() => navigate('/ClientProfile')}
                variant="outline"
                className="flex-1 border-2 border-stone-200 text-stone-600 font-headline font-bold py-6 rounded-2xl hover:bg-stone-50"
              >
                <X className="w-5 h-5 mr-2" />取消
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
      <ClientBottomNav />
    </div>
  );
}