import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronRight, LogOut, Settings, ShoppingCart, MessageCircle, LayoutDashboard, Zap, User, FileText, Bell } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import CartDrawer from "@/components/home/CartDrawer";

export default function ClientProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const { totalCount, setOpen: setCartOpen } = useCart();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const userData = await base44.auth.me();
      setUser(userData);
      setIsLoadingUser(false);
    };
    loadUser();
  }, []);

  const { data: clientProfile = [] } = useQuery({
    queryKey: ['clientProfile', user?.id],
    queryFn: () => base44.entities.ClientProfile.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });
  const profile = clientProfile?.[0];

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  const displayName = user?.full_name || '訪客';
  const avatarLetter = displayName?.[0]?.toUpperCase() || 'U';

  // 遮蔽手機號碼
  const maskedPhone = profile?.phone
    ? profile.phone.replace(/(\d{4})\d+(\d{2})/, '$1****$2')
    : '尚未設定';

  // 遮蔽 email
  const maskedEmail = user?.email
    ? user.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c)
    : '';

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">

      {/* 頂部 Header */}
      <div className="bg-stone-100 px-4 pt-12 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-900">我的</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCartOpen(true)}
            className="relative w-10 h-10 flex items-center justify-center rounded-2xl bg-white hover:bg-stone-50 transition-colors shadow-sm">
            <ShoppingCart className="w-5 h-5 text-stone-700" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalCount > 9 ? '9+' : totalCount}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/VendorChatPage')}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-900 hover:bg-stone-700 transition-colors shadow-sm">
            <MessageCircle className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 px-4 space-y-4 pt-2">

        {/* 頭像區塊 */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <button
            onClick={() => navigate('/ClientProfileEdit')}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-stone-50 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0 border-2 border-stone-100">
              <span className="text-2xl font-bold text-stone-600">{avatarLetter}</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-bold text-stone-900">{displayName}</p>
              <p className="text-xs text-stone-400 mt-0.5">修改個人資訊</p>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-300 flex-shrink-0" />
          </button>
        </div>

        {/* 個人資訊群組 */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">個人資訊</p>

          {/* 名稱 */}
          <button onClick={() => navigate('/ClientProfileEdit')}
            className="w-full flex items-center px-4 py-3.5 border-t border-stone-100 hover:bg-stone-50 transition-colors">
            <span className="text-sm text-stone-800 w-20 flex-shrink-0">名稱</span>
            <span className="flex-1 text-sm text-stone-500 text-right">{displayName}</span>
            <ChevronRight className="w-4 h-4 text-stone-300 ml-2 flex-shrink-0" />
          </button>

          {/* 手機號碼 */}
          <button onClick={() => navigate('/ClientProfileEdit')}
            className="w-full flex items-center px-4 py-3.5 border-t border-stone-100 hover:bg-stone-50 transition-colors">
            <span className="text-sm text-stone-800 w-20 flex-shrink-0">手機號碼</span>
            <span className="flex-1 text-sm text-stone-500 text-right">{maskedPhone}</span>
            <ChevronRight className="w-4 h-4 text-stone-300 ml-2 flex-shrink-0" />
          </button>

          {/* 電子郵件 */}
          <button onClick={() => navigate('/ClientProfileEdit')}
            className="w-full flex items-center px-4 py-3.5 border-t border-stone-100 hover:bg-stone-50 transition-colors">
            <span className="text-sm text-stone-800 w-20 flex-shrink-0">電子郵件</span>
            <span className="flex-1 text-sm text-stone-400 text-right truncate max-w-[160px]">{maskedEmail}</span>
            <ChevronRight className="w-4 h-4 text-stone-300 ml-2 flex-shrink-0" />
          </button>

          {/* 地址 */}
          <button onClick={() => navigate('/ClientProfileEdit')}
            className="w-full flex items-center px-4 py-3.5 border-t border-stone-100 hover:bg-stone-50 transition-colors">
            <span className="text-sm text-stone-800 w-20 flex-shrink-0">服務地址</span>
            <span className={`flex-1 text-sm text-right truncate max-w-[180px] ${profile?.address ? 'text-stone-500' : 'text-amber-500'}`}>
              {profile?.address || '立即設定'}
            </span>
            <ChevronRight className="w-4 h-4 text-stone-300 ml-2 flex-shrink-0" />
          </button>
        </div>

        {/* 齒輪設定群組 */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">設定</p>

          <button onClick={() => navigate('/ClientProfileEdit')}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-stone-100 hover:bg-stone-50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="flex-1 text-sm text-stone-800 text-left">我的檔案</span>
            <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
          </button>

          <button onClick={() => navigate('/MyBookings')}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-stone-100 hover:bg-stone-50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-stone-700 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <span className="flex-1 text-sm text-stone-800 text-left">我的設定</span>
            <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
          </button>

          <button onClick={() => navigate('/ClientProfileEdit')}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-stone-100 hover:bg-stone-50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <span className="flex-1 text-sm text-stone-800 text-left">我的帳號</span>
            <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
          </button>
        </div>

        {/* 台端切換（僅 admin 或 cleaner 可見） */}
        {(user?.role === 'admin' || user?.role === 'cleaner') && (
          <div className="bg-white rounded-2xl overflow-hidden">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-amber-600 uppercase tracking-wider">台端切換</p>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/AdminDashboard')}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-stone-100 hover:bg-stone-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <LayoutDashboard className="w-4 h-4 text-amber-700" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-stone-800">後台管理</p>
                  <p className="text-xs text-stone-400">訂單、派案、報表</p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
              </button>
            )}
            <button onClick={() => navigate('/CleanerJobs')}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-stone-100 hover:bg-stone-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-amber-700" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm text-stone-800">中台（清潔師）</p>
                <p className="text-xs text-stone-400">任務地圖、接單管理</p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
            </button>
          </div>
        )}

        {/* 登出 */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <button onClick={() => base44.auth.logout()}
            className="w-full flex items-center px-4 py-3.5 hover:bg-stone-50 transition-colors">
            <span className="flex-1 text-sm font-medium text-red-500 text-center">登出</span>
          </button>
        </div>

      </div>

      <CartDrawer />
      <ClientBottomNav />
    </div>
  );
}