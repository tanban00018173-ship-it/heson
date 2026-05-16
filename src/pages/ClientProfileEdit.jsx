import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

// 單行可點擊編輯的 Row
function InfoRow({ label, value, placeholder, onTap }) {
  return (
    <button
      onClick={onTap}
      className="w-full flex items-center px-4 py-3.5 border-t border-stone-100 hover:bg-stone-50 transition-colors"
    >
      <span className="text-sm text-stone-800 w-24 flex-shrink-0">{label}</span>
      <span className={`flex-1 text-sm text-right truncate ${value ? 'text-stone-500' : 'text-amber-500'}`}>
        {value || placeholder || '立即設定'}
      </span>
      <ChevronRight className="w-4 h-4 text-stone-300 ml-2 flex-shrink-0" />
    </button>
  );
}

// 編輯彈出底部 Sheet
function EditSheet({ label, value, onSave, onClose }) {
  const [val, setVal] = useState(value || '');
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-sm text-stone-400">取消</button>
          <p className="text-sm font-semibold text-stone-800">{label}</p>
          <button onClick={() => onSave(val)} className="text-sm font-semibold text-blue-500">完成</button>
        </div>
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400"
          placeholder={`請輸入${label}`}
        />
      </div>
    </div>
  );
}

export default function ClientProfileEdit() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // { field, label }
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

  const { data: clientProfile = [] } = useQuery({
    queryKey: ['clientProfile', user?.id],
    queryFn: () => base44.entities.ClientProfile.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (clientProfile?.[0]) {
      const p = clientProfile[0];
      setFormData({
        phone: p.phone || '',
        address: p.address || '',
        housing_type: p.housing_type || '',
        square_footage: p.square_footage ? String(p.square_footage) : '',
        family_members: p.family_members || '',
        has_pets: p.has_pets || false,
      });
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
      toast.success("已儲存");
    },
  });

  const handleSaveField = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    saveMutation.mutate(newData);
    setEditing(null);
  };

  const displayName = user?.full_name || '訪客';
  const avatarLetter = displayName?.[0]?.toUpperCase() || 'U';
  const maskedEmail = user?.email
    ? user.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c)
    : '';

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">

      {/* 頂部導航 */}
      <div className="bg-stone-100 px-4 pt-12 pb-2 flex items-center">
        <button onClick={() => navigate('/ClientProfile')}
          className="w-8 h-8 flex items-center justify-center -ml-1 mr-2">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-stone-900 -ml-10">修改個人資訊</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-28 px-4 pt-4 space-y-4">

        {/* 頭像區塊 */}
        <div className="flex flex-col items-center py-6 bg-white rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center border-2 border-stone-100">
            <span className="text-3xl font-bold text-stone-500">{avatarLetter}</span>
          </div>
          <button className="mt-2 flex items-center gap-1 text-sm text-stone-500">
            <span>✏️</span><span>編輯</span>
          </button>
        </div>

        {/* 基本資料 */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">基本資料</p>
          <InfoRow
            label="名稱"
            value={displayName}
            onTap={() => {}} // 名稱由系統管理，不可編輯
          />
          <InfoRow
            label="簡介"
            value={formData.family_members}
            placeholder="立即設定"
            onTap={() => setEditing({ field: 'family_members', label: '簡介' })}
          />
        </div>

        {/* 個人資訊 */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">個人資訊</p>
          <InfoRow
            label="房屋類型"
            value={formData.housing_type}
            placeholder="立即設定"
            onTap={() => setEditing({ field: 'housing_type', label: '房屋類型' })}
          />
          <InfoRow
            label="坪數"
            value={formData.square_footage ? `${formData.square_footage} 坪` : ''}
            placeholder="立即設定"
            onTap={() => setEditing({ field: 'square_footage', label: '坪數' })}
          />
        </div>

        {/* 帳號資訊 */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">帳號資訊</p>
          <InfoRow
            label="手機號碼"
            value={formData.phone ? formData.phone.replace(/(\d{4})\d+(\d{2})/, '$1****$2') : ''}
            placeholder="立即設定"
            onTap={() => setEditing({ field: 'phone', label: '手機號碼' })}
          />
          <InfoRow
            label="電子郵件"
            value={maskedEmail}
            onTap={() => {}}
          />
          <InfoRow
            label="服務地址"
            value={formData.address}
            placeholder="立即設定"
            onTap={() => setEditing({ field: 'address', label: '服務地址' })}
          />
        </div>

      </div>

      {/* 編輯底部 Sheet */}
      {editing && (
        <EditSheet
          label={editing.label}
          value={formData[editing.field]}
          onSave={(val) => handleSaveField(editing.field, val)}
          onClose={() => setEditing(null)}
        />
      )}

      <ClientBottomNav />
    </div>
  );
}