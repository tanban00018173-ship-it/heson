import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import EditSheet from "@/components/profile/EditSheet";

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

function RowItem({ label, value, onEdit, masked }) {
  return (
    <button
      onClick={onEdit}
      className="w-full flex items-center justify-between px-4 py-3.5 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors"
    >
      <span className="text-sm text-stone-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-stone-800">{value || '—'}</span>
        <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
      </div>
    </button>
  );
}

export default function ClientPersonalInfo() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const [editField, setEditField] = useState(null); // { key, title, value, inputType, placeholder }

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

  const openEdit = (field) => setEditField(field);
  const closeEdit = () => setEditField(null);

  const handleSave = async (newValue) => {
    if (!editField) return;
    const { key } = editField;

    if (key === 'full_name') {
      await base44.auth.updateMe({ full_name: newValue });
      const updated = await base44.auth.me();
      setUser(updated);
    } else if (key === 'phone' || key === 'gender' || key === 'birthday') {
      if (profile?.id) {
        await base44.entities.ClientProfile.update(profile.id, { [key]: newValue });
      } else {
        await base44.entities.ClientProfile.create({ user_id: user.id, [key]: newValue, address: '' });
      }
      queryClient.invalidateQueries({ queryKey: ['clientProfile', user?.id] });
    }
    closeEdit();
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col">
      {/* 頂部導航 */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors mr-2">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-stone-900 -ml-9">個人資訊</h1>
      </div>

      {/* 固定頭像區 */}
      <div className="bg-[#f2f2f7] px-4 pt-6 pb-3">
        <div className="flex flex-col items-center py-6 bg-white rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-stone-800 flex items-center justify-center mb-3">
            <span className="text-3xl font-bold text-white">{avatarLetter}</span>
          </div>
          <p className="text-base font-bold text-stone-900">{displayName}</p>
          <p className="text-xs text-stone-400 mt-0.5">{maskEmail(user?.email)}</p>
        </div>
      </div>

      {/* 捲動內容區 */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4">
        {/* 基本資料 */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <p className="px-4 pt-4 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">基本資料</p>
          <RowItem
            label="姓名"
            value={displayName}
            onEdit={() => openEdit({ key: 'full_name', title: '姓名', value: user?.full_name, inputType: 'text', placeholder: '請輸入姓名' })}
          />
          <RowItem
            label="性別"
            value={profile?.gender || '未設定'}
            onEdit={() => openEdit({ key: 'gender', title: '性別', value: profile?.gender, inputType: 'select-gender' })}
          />
          <RowItem
            label="生日"
            value={profile?.birthday || '未設定'}
            onEdit={() => openEdit({ key: 'birthday', title: '生日', value: profile?.birthday, inputType: 'date' })}
          />
        </div>

        {/* 聯絡方式 */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <p className="px-4 pt-4 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">聯絡方式</p>
          <RowItem
            label="手機號碼"
            value={maskPhone(profile?.phone)}
            onEdit={() => openEdit({ key: 'phone', title: '手機號碼', value: profile?.phone, inputType: 'tel', placeholder: '請輸入手機號碼' })}
          />
          <RowItem
            label="電子郵件"
            value={maskEmail(user?.email)}
            onEdit={() => {}} // email 不可編輯，僅顯示
          />
        </div>
      </div>

      <ClientBottomNav />

      <EditSheet
        open={!!editField}
        title={editField?.title || ''}
        value={editField?.value || ''}
        inputType={editField?.inputType || 'text'}
        placeholder={editField?.placeholder || ''}
        onClose={closeEdit}
        onSave={handleSave}
      />
    </div>
  );
}