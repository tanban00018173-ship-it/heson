import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User, Phone, Mail, ChevronRight } from "lucide-react";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";

function maskPhone(phone) {
  if (!phone) return '—';
  return phone.replace(/(\d{4})\d{3}(\d{3})/, '$1***$2');
}

function maskEmail(email) {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return local.slice(0, 2) + '***@' + domain;
}

function RowItem({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-50 last:border-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-sm font-medium text-stone-800">{value || '—'}</span>
    </div>
  );
}

export default function ClientPersonalInfo() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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

  const profile = clientProfile?.[0];
  const displayName = user?.full_name || '訪客';
  const avatarLetter = displayName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col">
      {/* 頂部導航 */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors mr-2">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-stone-900 -ml-9">個人資訊</h1>
      </div>

      <div className="flex-1 px-4 pt-6 pb-32 space-y-4">
        {/* 頭像區 */}
        <div className="flex flex-col items-center py-6 bg-white rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-stone-800 flex items-center justify-center mb-3">
            <span className="text-3xl font-bold text-white">{avatarLetter}</span>
          </div>
          <p className="text-base font-bold text-stone-900">{displayName}</p>
          <p className="text-xs text-stone-400 mt-0.5">{maskEmail(user?.email)}</p>
        </div>

        {/* 基本資料 */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <p className="px-4 pt-4 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">基本資料</p>
          <RowItem label="姓名" value={displayName} />
          <RowItem label="性別" value={profile?.gender || '未設定'} />
          <RowItem label="生日" value={profile?.birthday || '未設定'} />
        </div>

        {/* 聯絡方式 */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <p className="px-4 pt-4 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">聯絡方式</p>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-50">
            <span className="text-sm text-stone-500">手機號碼</span>
            <span className="text-sm font-medium text-stone-800">{maskPhone(profile?.phone)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-stone-500">電子郵件</span>
            <span className="text-sm font-medium text-stone-800">{maskEmail(user?.email)}</span>
          </div>
        </div>

        {/* 編輯按鈕 */}
        <button
          onClick={() => navigate('/ClientProfileEdit')}
          className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-stone-700 transition-colors"
        >
          編輯個人資料
        </button>
      </div>

      <ClientBottomNav />
    </div>
  );
}