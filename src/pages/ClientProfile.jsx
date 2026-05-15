import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, PawPrint, LogOut, Edit2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ClientProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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



  return (
    <div className="min-h-screen bg-[#f6f9ff] flex font-body">
      <div className="hidden lg:block"><Sidebar userRole="client" userName={user?.full_name} /></div>
      <MobileNav userRole="client" userName={user?.full_name} />

      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-2xl mx-auto pb-28">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 font-headline mb-1">帳戶設定</p>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-stone-900">個人資料</h1>
          </motion.div>

          {/* Profile Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
            <div className="bg-[#131b2e] rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-3xl" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10">
                    <span className="text-white text-2xl font-headline font-bold">
                      {user?.full_name?.[0] || 'U'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-white font-headline font-extrabold text-xl">{user?.full_name || '訪客'}</h2>
                    <p className="text-[#7c839b] text-sm mt-0.5">{user?.email}</p>
                    {clientProfile?.[0]?.subscription_plan && (
                      <span className="inline-block mt-2 bg-white/10 text-[#bec6e0] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        {clientProfile[0].subscription_plan}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  onClick={() => navigate('/ClientProfileEdit')}
                  className="bg-white/10 border border-white/20 hover:bg-white/20 text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Profile Info - Read Only */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white rounded-3xl border border-[#e8eef6] p-6 mb-5">
                  <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-5">帳戶資訊</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-[#eef4fc] rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                          <Phone className="w-4 h-4 text-stone-700" />
                        </div>
                        <div>
                          <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">聯絡電話</p>
                          <p className="font-semibold text-stone-900 text-sm">{formData.phone || '未設定'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#eef4fc] rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-stone-700" />
                        </div>
                        <div>
                          <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">服務地址</p>
                          <p className="font-semibold text-stone-900 text-sm">{formData.address || '未設定'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-[#e8eef6] p-6 mb-5">
                  <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-5">居家資訊</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-4 bg-[#eef4fc] rounded-2xl">
                      <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-1">房屋類型</p>
                      <p className="font-semibold text-stone-900 text-sm">{formData.housing_type || '未設定'}</p>
                    </div>
                    <div className="p-4 bg-[#eef4fc] rounded-2xl">
                      <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-1">坪數</p>
                      <p className="font-semibold text-stone-900 text-sm">{formData.square_footage ? `${formData.square_footage} 坪` : '未設定'}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[#eef4fc] rounded-2xl mb-3">
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-1">家庭成員</p>
                    <p className="font-semibold text-stone-900 text-sm">{formData.family_members || '未設定'}</p>
                  </div>
                  <div className="p-4 bg-[#eef4fc] rounded-2xl">
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-1">寵物</p>
                    <p className="font-semibold text-stone-900 text-sm">{formData.has_pets ? '有寵物 ✓' : '無寵物'}</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-[#e8eef6] p-6 mb-5">
                  <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-5">訂閱資訊</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-[#eef4fc] rounded-2xl">
                      <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-1">目前方案</p>
                      <p className="font-headline font-bold text-stone-900 text-base">{clientProfile?.[0]?.subscription_plan || '無'}</p>
                    </div>
                    <div className="p-4 bg-[#eef4fc] rounded-2xl">
                      <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-1">剩餘次數</p>
                      <p className="font-headline font-bold text-stone-900 text-base">{clientProfile?.[0]?.remaining_visits ?? 0} 次</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => base44.auth.logout()}
                  variant="outline"
                  className="w-full border-2 border-stone-200 text-stone-500 font-headline font-bold py-6 rounded-2xl hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <LogOut className="w-5 h-5 mr-2" />登出
                </Button>
            </motion.div>
        </div>
      </main>
      <ClientBottomNav />
    </div>
  );
}