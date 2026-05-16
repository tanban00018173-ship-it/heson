import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, User } from "lucide-react";
import { toast } from "sonner";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";

function FieldRow({ label, value, placeholder, onTap, valueColor }) {
  return (
    <button
      onClick={onTap}
      className="w-full flex items-center px-4 py-3.5 bg-white hover:bg-stone-50 transition-colors border-t border-stone-100 first:border-t-0"
    >
      <span className="text-sm text-stone-800 flex-shrink-0 w-24 text-left">{label}</span>
      <span className={`flex-1 text-sm text-right truncate mr-2 ${valueColor || (value ? 'text-stone-500' : 'text-orange-500')}`}>
        {value || placeholder || '立即設定'}
      </span>
      <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
    </button>
  );
}

function GroupCard({ title, children }) {
  return (
    <div className="mx-4 mb-3">
      {title && <p className="text-xs text-stone-400 px-1 mb-1">{title}</p>}
      <div className="bg-white rounded-2xl overflow-hidden border border-stone-100">
        {children}
      </div>
    </div>
  );
}

function EditSheet({ field, label, value, onSave, onClose }) {
  const [val, setVal] = useState(value || '');
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <p className="text-base font-bold text-stone-900 mb-4">{label}</p>
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
          placeholder={`請輸入${label}`}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-stone-200 text-sm font-medium text-stone-600">取消</button>
          <button onClick={() => { onSave(val); onClose(); }} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-bold">儲存</button>
        </div>
      </div>
    </div>
  );
}

export default function ClientProfileEdit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(null); // { field, label }
  const [formData, setFormData] = useState({ phone: '', address: '' });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: clientProfile = [] } = useQuery({
    queryKey: ['clientProfile', user?.id],
    queryFn: () => base44.entities.ClientProfile.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (clientProfile?.[0]) {
      const p = clientProfile[0];
      setFormData({ phone: p.phone || '', address: p.address || '' });
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
      toast.success('已儲存');
    },
  });

  const handleSave = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    saveMutation.mutate(updated);
  };

  const avatarLetter = user?.full_name?.[0]?.toUpperCase() || 'U';

  // 遮蔽電話
  const maskedPhone = formData.phone
    ? formData.phone.replace(/(.{3})(.+)(.{2})/, (_, a, b, c) => a + b.replace(/./g, '*') + c)
    : '';

  // 遮蔽 email
  const maskedEmail = user?.email
    ? user.email.replace(/^(.)(.+)(@.+)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c)
    : '';

  return (
    <div className="min-h-screen bg-stone-100">

      {/* 頂部導航 */}
      <div className="bg-white border-b border-stone-100 flex items-center px-4 py-3 sticky top-0 z-20">
        <button onClick={() => navigate('/ClientProfile')} className="p-1 -ml-1 mr-2">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-stone-900">修改個人資訊</h1>
        <div className="w-7" />{/* 平衡用 */}
      </div>

      {/* 頭像區塊 */}
      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 rounded-full bg-stone-300 flex items-center justify-center mb-2">
          <span className="text-3xl font-bold text-white">{avatarLetter}</span>
        </div>
        <button className="flex items-center gap-1 text-xs text-stone-500">
          <User className="w-3.5 h-3.5" />
          編輯
        </button>
      </div>

      {/* 基本資料 */}
      <GroupCard>
        <FieldRow
          label="名稱"
          value={user?.full_name}
          placeholder="未設定"
          onTap={() => {}}
          valueColor="text-stone-500"
        />
        <FieldRow
          label="地址"
          value={formData.address}
          placeholder="立即設定"
          onTap={() => setEditing({ field: 'address', label: '服務地址' })}
        />
      </GroupCard>

      {/* 帳號資訊 */}
      <GroupCard title="">
        <FieldRow
          label="手機號碼"
          value={maskedPhone}
          placeholder="立即設定"
          onTap={() => setEditing({ field: 'phone', label: '手機號碼' })}
          valueColor="text-stone-500"
        />
        <FieldRow
          label="電子郵件"
          value={maskedEmail ? (
            <span>{maskedEmail} <span className="text-orange-500">現在驗證</span></span>
          ) : null}
          placeholder="未設定"
          onTap={() => {}}
          valueColor="text-stone-500"
        />
      </GroupCard>

      {/* 編輯底部 Sheet */}
      {editing && (
        <EditSheet
          field={editing.field}
          label={editing.label}
          value={formData[editing.field]}
          onSave={(val) => handleSave(editing.field, val)}
          onClose={() => setEditing(null)}
        />
      )}

      <ClientBottomNav />
    </div>
  );
}