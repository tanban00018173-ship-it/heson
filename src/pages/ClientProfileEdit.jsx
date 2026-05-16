import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, ChevronRight, User, Pencil } from "lucide-react";
import { toast } from "sonner";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";

// 遮蔽電話
function maskPhone(phone) {
  if (!phone) return '尚未設定';
  return phone.slice(0, 2) + '****' + phone.slice(-2);
}

// 單一可點擊編輯列
function SettingRow({ label, value, placeholder, onClick, valueClass }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center px-4 py-3.5 hover:bg-stone-50 transition-colors text-left"
    >
      <span className="text-sm text-stone-800 w-24 flex-shrink-0">{label}</span>
      <span className={`flex-1 text-sm truncate text-right mr-2 ${valueClass || (value ? 'text-stone-500' : 'text-stone-300')}`}>
        {value || placeholder || '立即設定'}
      </span>
      <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
    </button>
  );
}

// inline 編輯彈窗
function EditModal({ label, children, onClose, onSave, saving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
        <p className="text-base font-bold text-stone-900 mb-4">{label}</p>
        {children}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-stone-200 text-sm font-semibold text-stone-600">取消</button>
          <button onClick={onSave} disabled={saving} className="flex-1 py-3 rounded-2xl bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '儲存'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientProfileEdit() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  // form state
  const [formData, setFormData] = useState({
    phone: '', address: '', housing_type: '', square_footage: '',
    family_members: '', has_pets: false,
  });

  // editing state
  const [editField, setEditField] = useState(null); // null | 'name' | 'bio' | 'phone' | 'address' | 'housing' | 'pets'
  const [editValue, setEditValue] = useState('');

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
  const profile = clientProfile?.[0];

  useEffect(() => {
    if (profile) {
      setFormData({
        phone: profile.phone || '',
        address: profile.address || '',
        housing_type: profile.housing_type || '',
        square_footage: profile.square_footage || '',
        family_members: profile.family_members || '',
        has_pets: profile.has_pets || false,
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) return base44.entities.ClientProfile.update(profile.id, data);
      return base44.entities.ClientProfile.create({ ...data, user_id: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile'] });
      toast.success('資料已更新');
      setEditField(null);
    },
  });

  const openEdit = (field, current) => {
    setEditField(field);
    setEditValue(current ?? '');
  };

  const saveField = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    saveMutation.mutate(updated);
  };

  const avatarLetter = user?.full_name?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-stone-100">
      {/* 頂部導航 */}
      <div className="bg-white sticky top-0 z-20 border-b border-stone-100">
        <div className="relative flex items-center justify-center h-12 px-4">
          <button onClick={() => navigate('/ClientProfile')} className="absolute left-4 p-1 text-orange-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold text-stone-900">修改個人資訊</span>
        </div>
      </div>

      <div className="pb-32">
        {/* 頭像區 */}
        <div className="bg-white mt-4 mx-4 rounded-2xl flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center mb-2">
            {user ? (
              <span className="text-3xl font-bold text-stone-500">{avatarLetter}</span>
            ) : (
              <User className="w-10 h-10 text-stone-400" />
            )}
          </div>
          <button className="flex items-center gap-1 text-sm text-stone-500">
            <Pencil className="w-3.5 h-3.5" /> 編輯
          </button>
        </div>

        {/* 基本資料 */}
        <div className="bg-white mt-4 mx-4 rounded-2xl overflow-hidden divide-y divide-stone-100">
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">基本資料</p>
          <SettingRow
            label="名稱"
            value={user?.full_name}
            placeholder="立即設定"
            onClick={() => openEdit('name', user?.full_name)}
          />
          <SettingRow
            label="服務地址"
            value={formData.address}
            placeholder="立即設定"
            onClick={() => openEdit('address', formData.address)}
          />
        </div>

        {/* 居家資訊 */}
        <div className="bg-white mt-4 mx-4 rounded-2xl overflow-hidden divide-y divide-stone-100">
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">居家資訊</p>
          <SettingRow
            label="房屋類型"
            value={formData.housing_type}
            placeholder="立即設定"
            valueClass={formData.housing_type ? 'text-stone-500' : 'text-orange-500 font-medium'}
            onClick={() => openEdit('housing_type', formData.housing_type)}
          />
          <SettingRow
            label="坪數"
            value={formData.square_footage ? `${formData.square_footage} 坪` : ''}
            placeholder="立即設定"
            valueClass={formData.square_footage ? 'text-stone-500' : 'text-orange-500 font-medium'}
            onClick={() => openEdit('square_footage', formData.square_footage)}
          />
          <SettingRow
            label="家庭成員"
            value={formData.family_members}
            placeholder="立即設定"
            valueClass={formData.family_members ? 'text-stone-500' : 'text-orange-500 font-medium'}
            onClick={() => openEdit('family_members', formData.family_members)}
          />
          <button
            onClick={() => saveField('has_pets', !formData.has_pets)}
            className="w-full flex items-center px-4 py-3.5 hover:bg-stone-50 transition-colors"
          >
            <span className="text-sm text-stone-800 w-24 flex-shrink-0">有寵物</span>
            <span className="flex-1" />
            <Switch
              checked={formData.has_pets}
              onCheckedChange={(v) => saveField('has_pets', v)}
              className="data-[state=checked]:bg-amber-500"
              onClick={e => e.stopPropagation()}
            />
          </button>
        </div>

        {/* 帳號資訊 */}
        <div className="bg-white mt-4 mx-4 rounded-2xl overflow-hidden divide-y divide-stone-100">
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">帳號資訊</p>
          <SettingRow
            label="手機號碼"
            value={maskPhone(formData.phone)}
            onClick={() => openEdit('phone', formData.phone)}
          />
          <button
            onClick={() => {}}
            className="w-full flex items-center px-4 py-3.5 hover:bg-stone-50 transition-colors text-left"
          >
            <span className="text-sm text-stone-800 w-24 flex-shrink-0">電子郵件</span>
            <span className="flex-1 text-sm text-stone-500 truncate text-right mr-2">
              {user?.email ? user.email.replace(/(.{2}).*(@.*)/, '$1****$2') : '尚未綁定'}
            </span>
            <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
          </button>
        </div>
      </div>

      <ClientBottomNav />

      {/* 編輯 Modal */}
      {editField === 'address' && (
        <EditModal label="服務地址" onClose={() => setEditField(null)} onSave={() => saveField('address', editValue)} saving={saveMutation.isPending}>
          <Input value={editValue} onChange={e => setEditValue(e.target.value)} placeholder="請輸入完整地址" className="rounded-xl" />
        </EditModal>
      )}
      {editField === 'phone' && (
        <EditModal label="手機號碼" onClose={() => setEditField(null)} onSave={() => saveField('phone', editValue)} saving={saveMutation.isPending}>
          <Input value={editValue} onChange={e => setEditValue(e.target.value)} placeholder="0912-345-678" className="rounded-xl" />
        </EditModal>
      )}
      {editField === 'housing_type' && (
        <EditModal label="房屋類型" onClose={() => setEditField(null)} onSave={() => saveField('housing_type', editValue)} saving={saveMutation.isPending}>
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="透天">透天厝</SelectItem>
              <SelectItem value="公寓">公寓</SelectItem>
              <SelectItem value="大樓">大樓</SelectItem>
            </SelectContent>
          </Select>
        </EditModal>
      )}
      {editField === 'square_footage' && (
        <EditModal label="坪數" onClose={() => setEditField(null)} onSave={() => saveField('square_footage', editValue)} saving={saveMutation.isPending}>
          <Input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} placeholder="例：30" className="rounded-xl" />
        </EditModal>
      )}
      {editField === 'family_members' && (
        <EditModal label="家庭成員" onClose={() => setEditField(null)} onSave={() => saveField('family_members', editValue)} saving={saveMutation.isPending}>
          <Input value={editValue} onChange={e => setEditValue(e.target.value)} placeholder="例：2 大 1 小" className="rounded-xl" />
        </EditModal>
      )}
      {editField === 'name' && (
        <EditModal label="名稱" onClose={() => setEditField(null)} onSave={() => { toast('姓名需至客服修改'); setEditField(null); }} saving={false}>
          <p className="text-sm text-stone-500">姓名變更需聯繫客服協助處理。</p>
        </EditModal>
      )}
    </div>
  );
}