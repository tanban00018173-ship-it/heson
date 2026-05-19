import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, LogOut, ChevronRight, HelpCircle, MessageSquare, MessageCircle, Shield, Phone, FileText, Settings, ShoppingCart } from "lucide-react";

import { useCart } from "@/lib/CartContext";
import CartDrawer from "@/components/home/CartDrawer";

export default function ClientProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();


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

  const profile = clientProfile?.[0];

  const { totalCount, setOpen: setCartOpen } = useCart();

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
      <div className="bg-black pt-8 pb-4 px-6 text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ClientPersonalInfo')}
            className="w-12 h-12 rounded-full bg-stone-700 flex items-center justify-center border-2 border-white/20 flex-shrink-0 hover:bg-stone-600 transition-colors"
          >
            <span className="text-lg font-bold text-white">{avatarLetter}</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold truncate">{displayName}</p>
            <p className="text-white/40 text-xs truncate">{user?.email}</p>
          </div>
          {/* 右上角三個按鈕 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => navigate('/ClientProfileEdit')}
              className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Settings className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => setCartOpen(true)}
              className="relative w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ShoppingCart className="w-5 h-5 text-white" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalCount > 9 ? '9+' : totalCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/VendorChatPage')}
              className="w-10 h-10 rounded-2xl bg-stone-900 flex items-center justify-center hover:bg-stone-700 transition-colors">
              <MessageCircle className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* 訂閱方案統計 */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-sm font-bold">{profile?.subscription_plan || '—'}</p>
            <p className="text-white/40 text-xs">目前方案</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-sm font-bold">{profile?.remaining_visits ?? '—'}</p>
            <p className="text-white/40 text-xs">剩餘次數</p>
          </div>
        </div>
      </div>

      {/* 內容區 */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="p-4 space-y-2">

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
      <CartDrawer />
    </div>
  );
}