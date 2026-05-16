import React from 'react';
import { ChevronRight, X, User } from 'lucide-react';

function maskPhone(phone) {
  if (!phone) return '尚未設定';
  return phone.slice(0, 2) + '****' + phone.slice(-2);
}

function maskEmail(email) {
  if (!email) return '尚未設定';
  const [local, domain] = email.split('@');
  const masked = local[0] + '*'.repeat(Math.max(1, local.length - 2)) + local[local.length - 1];
  return `${masked}@${domain}`;
}

function RowItem({ label, value, placeholder, valueColor }) {
  return (
    <div className="flex items-center px-4 py-3.5 border-b border-stone-100 last:border-0">
      <span className="text-sm text-stone-800 w-24 flex-shrink-0">{label}</span>
      <span className={`flex-1 text-sm text-right ${valueColor || (value ? 'text-stone-500' : 'text-stone-300')}`}>
        {value || placeholder || '尚未設定'}
      </span>
      <ChevronRight className="w-4 h-4 text-stone-300 ml-2 flex-shrink-0" />
    </div>
  );
}

export default function PersonalInfoDrawer({ open, onClose, user, profile }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Drawer 面板 */}
      <div
        className="relative bg-[#f2f2f7] rounded-t-3xl max-h-[90vh] overflow-y-auto pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部拖曳把手 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-300 rounded-full" />
        </div>

        {/* 標題列 */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-lg font-bold text-stone-900">修改個人資訊</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
            <X className="w-4 h-4 text-stone-600" />
          </button>
        </div>

        {/* 頭像區塊 */}
        <div className="flex flex-col items-center py-5 bg-white mx-4 rounded-2xl mb-4">
          <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center mb-2 border border-stone-100">
            <User className="w-10 h-10 text-stone-400" />
          </div>
          <button className="text-sm text-stone-500 flex items-center gap-1">
            <span>✏️</span>
            <span>編輯</span>
          </button>
        </div>

        {/* 基本資料群組 */}
        <div className="bg-white rounded-2xl mx-4 overflow-hidden mb-3">
          <RowItem label="名稱" value={user?.full_name} placeholder="尚未設定" />
          <RowItem label="簡介" value={null} placeholder="立即設定" />
        </div>

        {/* 個人資訊群組 */}
        <div className="bg-white rounded-2xl mx-4 overflow-hidden mb-3">
          <RowItem label="性別" value={null} placeholder="立即設定" valueColor="text-orange-500" />
          <RowItem label="生日" value={null} placeholder="尚未設定" />
        </div>

        {/* 帳號資訊群組 */}
        <div className="bg-white rounded-2xl mx-4 overflow-hidden mb-3">
          <RowItem label="手機號碼" value={maskPhone(profile?.phone)} />
          <div className="flex items-center px-4 py-3.5 border-b border-stone-100 last:border-0">
            <span className="text-sm text-stone-800 w-24 flex-shrink-0">電子郵件</span>
            <span className="flex-1 text-sm text-right text-stone-500 truncate">{maskEmail(user?.email)}</span>
            <ChevronRight className="w-4 h-4 text-stone-300 ml-2 flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}