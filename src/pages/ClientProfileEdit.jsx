import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

// 遮蔽手機號碼
function maskPhone(phone) {
  if (!phone) return null;
  return phone.replace(/^(.{3})(.+)(.{2})$/, (_, a, b, c) => a + '*'.repeat(b.length) + c);
}

// 遮蔽 email
function maskEmail(email) {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return local.slice(0, 1) + '***' + local.slice(-1) + '@' + domain;
}

// 單一 row 元件
function SettingRow({ label, value, placeholder, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition-colors text-left"
    >
      <span className="text-sm text-stone-800">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`text-sm ${value ? 'text-stone-600' : 'text-orange-400'}`}>
          {value || placeholder || '立即設定'}
        </span>
        <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
      </div>
    </button>
  );
}

// inline 編輯 row（點擊後直接在行內輸入）
function EditableRow({ label, value, placeholder, fieldKey, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');

  const handleBlur = () => {
    onChange(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="text-sm text-stone-800 flex-shrink-0 mr-4">{label}</span>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          className="text-sm text-right text-stone-700 bg-transparent outline-none border-b border-stone-300 flex-1"
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value || ''); setEditing(true); }}
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition-colors text-left"
    >
      <span className="text-sm text-stone-800">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`text-sm ${value ? 'text-stone-600' : 'text-orange-400'}`}>
          {value || placeholder || '立即設定'}
        </span>
        <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
      </div>
    </button>
  );
}

export default function ClientProfileEdit() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
  });
  const [originalData, setOriginalData] = useState(null);
  const [saving, setSaving] = useState(false);

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
      const data = { phone: p.phone || '', address: p.address || '' };
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

  const setField = (key) => (val) => setFormData(prev => ({ ...prev, [key]: val }));

  const displayName = user?.full_name || '';
  const avatarLetter = displayName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="h-screen bg-stone-100 flex flex-col overflow-hidden">
      {/* 頂部導航 */}
      <div className="bg-white border-b border-stone-200 flex-shrink-0">
        <div className="relative flex items-center justify-center h-12">
          <button
            onClick={() => navigate('/ClientProfile')}
            className="absolute left-3 flex items-center gap-1 text-orange-500 text-sm font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-stone-900">修改個人資訊</h1>
          {hasChanges && (
            <button
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending}
              className="absolute right-4 text-sm font-semibold text-orange-500"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '儲存'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {/* 頭像區塊 */}
        <div className="bg-white mt-6 mb-6 py-6 flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center">
            {displayName ? (
              <span className="text-3xl font-bold text-stone-500">{avatarLetter}</span>
            ) : (
              <User className="w-10 h-10 text-stone-400" />
            )}
          </div>
          <button className="text-sm text-stone-500 flex items-center gap-1">
            <span>✏️</span>
            <span>編輯</span>
          </button>
        </div>

        {/* 基本資料群組 */}
        <div className="bg-white rounded-xl mx-4 overflow-hidden mb-4">
          <p className="px-4 pt-3 pb-1 text-xs text-stone-400 font-medium">基本資料</p>
          <div className="divide-y divide-stone-100">
            <SettingRow
              label="名稱"
              value={displayName}
              placeholder="立即設定"
            />
            <EditableRow
              label="簡介"
              value={formData.bio}
              placeholder="立即設定"
              fieldKey="bio"
              onChange={setField('bio')}
            />
          </div>
        </div>

        {/* 帳號資訊群組 */}
        <div className="bg-white rounded-xl mx-4 overflow-hidden mb-4">
          <p className="px-4 pt-3 pb-1 text-xs text-stone-400 font-medium">帳號資訊</p>
          <div className="divide-y divide-stone-100">
            <EditableRow
              label="手機號碼"
              value={maskPhone(formData.phone)}
              placeholder="立即設定"
              fieldKey="phone"
              onChange={setField('phone')}
            />
            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition-colors">
              <span className="text-sm text-stone-800">電子郵件</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-stone-400 max-w-[160px] truncate">
                  {user?.email ? maskEmail(user.email) : ''}
                </span>
                <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
              </div>
            </button>
          </div>
        </div>

        {/* 服務地址（保留功能） */}
        <div className="bg-white rounded-xl mx-4 overflow-hidden mb-4">
          <p className="px-4 pt-3 pb-1 text-xs text-stone-400 font-medium">服務設定</p>
          <div className="divide-y divide-stone-100">
            <EditableRow
              label="服務地址"
              value={formData.address}
              placeholder="立即設定"
              fieldKey="address"
              onChange={setField('address')}
            />
          </div>
        </div>
      </div>

      <ClientBottomNav />
    </div>
  );
}