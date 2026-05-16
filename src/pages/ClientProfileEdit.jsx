import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

// 單一欄位編輯 Modal
function FieldEditModal({ label, value, onChange, onClose, onSave, type = 'text', placeholder = '' }) {
  const [val, setVal] = useState(value || '');
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-2xl p-6" onClick={e => e.stopPropagation()}>
        <p className="text-base font-semibold text-stone-900 mb-4">{label}</p>
        <input
          autoFocus
          type={type}
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-stone-200 text-sm font-medium text-stone-600">取消</button>
          <button onClick={() => { onChange(val); onSave(val); onClose(); }} className="flex-1 py-3 rounded-xl bg-black text-sm font-medium text-white">儲存</button>
        </div>
      </div>
    </div>
  );
}

function maskPhone(phone) {
  if (!phone) return null;
  return phone.slice(0, 2) + '****' + phone.slice(-2);
}

function maskEmail(email) {
  if (!email) return null;
  const [local, domain] = email.split('@');
  return local[0] + '****' + local.slice(-1) + '@' + domain;
}

export default function ClientProfileEdit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [editingField, setEditingField] = useState(null); // { key, label, type, placeholder }
  const [formData, setFormData] = useState({ phone: '', address: '' });

  useEffect(() => {
    const load = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const u = await base44.auth.me();
      setUser(u);
    };
    load();
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
      toast.success('已更新');
    },
  });

  const handleSave = (key, val) => {
    const updated = { ...formData, [key]: val };
    setFormData(updated);
    saveMutation.mutate(updated);
  };

  const avatarLetter = user?.full_name?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-stone-100">
      {/* 頂部導航 */}
      <div className="bg-white sticky top-0 z-20 flex items-center justify-center h-14 px-4 border-b border-stone-100">
        <button onClick={() => navigate('/ClientProfile')} className="absolute left-4 p-1">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <span className="text-base font-semibold text-stone-900">修改個人資訊</span>
      </div>

      <div className="pb-28">
        {/* 頭像區塊 */}
        <div className="bg-white mt-4 py-6 flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center border border-stone-100">
            {user?.profile_photo
              ? <img src={user.profile_photo} className="w-full h-full object-cover rounded-full" />
              : <User className="w-10 h-10 text-stone-400" />
            }
          </div>
          <button className="flex items-center gap-1 text-sm text-stone-500">
            <span>✏️</span><span>編輯</span>
          </button>
        </div>

        {/* 基本資料 */}
        <div className="mt-4">
          <p className="px-4 pb-1 text-xs text-stone-400 font-medium">基本資料</p>
          <div className="bg-white divide-y divide-stone-100">
            <RowItem label="名稱" value={user?.full_name} placeholder="立即設定" onTap={null} />
            <RowItem label="服務地址" value={formData.address || null} placeholder="立即設定"
              onTap={() => setEditingField({ key: 'address', label: '服務地址', type: 'text', placeholder: '請輸入完整地址' })} />
          </div>
        </div>

        {/* 帳號資訊 */}
        <div className="mt-4">
          <p className="px-4 pb-1 text-xs text-stone-400 font-medium">帳號資訊</p>
          <div className="bg-white divide-y divide-stone-100">
            <RowItem label="手機號碼" value={maskPhone(formData.phone)} placeholder="立即設定" masked
              onTap={() => setEditingField({ key: 'phone', label: '手機號碼', type: 'tel', placeholder: '例：0912345678' })} />
            <RowItem label="電子郵件" value={maskEmail(user?.email)} placeholder="—" masked readOnly />
          </div>
        </div>
      </div>

      <ClientBottomNav />

      {/* 編輯 Modal */}
      {editingField && (
        <FieldEditModal
          label={editingField.label}
          value={formData[editingField.key]}
          type={editingField.type}
          placeholder={editingField.placeholder}
          onChange={() => {}}
          onSave={(val) => handleSave(editingField.key, val)}
          onClose={() => setEditingField(null)}
        />
      )}
    </div>
  );
}

function RowItem({ label, value, placeholder, onTap, masked, readOnly }) {
  return (
    <button
      onClick={onTap || undefined}
      disabled={!onTap}
      className="w-full flex items-center justify-between px-4 py-3.5 text-left disabled:cursor-default"
    >
      <span className="text-sm text-stone-800">{label}</span>
      <div className="flex items-center gap-1 max-w-[60%]">
        <span className={`text-sm truncate ${value ? 'text-stone-600' : 'text-stone-300'}`}>
          {value || placeholder}
        </span>
        {!readOnly && <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />}
      </div>
    </button>
  );
}