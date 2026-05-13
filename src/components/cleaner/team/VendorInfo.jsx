import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function VendorInfo({ vendor, user }) {
  const [copied, setCopied] = useState(false);
  const isAdmin = vendor.admin_id === user?.id;

  const copyCode = () => {
    navigator.clipboard.writeText(vendor.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {/* 廠商名稱 */}
      <div className="bg-stone-50 border border-stone-100 rounded-xl p-4">
        <p className="text-xs text-stone-400 mb-1">廠商名稱</p>
        <p className="text-lg font-bold text-stone-800">{vendor.name}</p>
        {vendor.description && (
          <p className="text-sm text-stone-500 mt-1">{vendor.description}</p>
        )}
      </div>

      {/* 廠商代碼 */}
      <div className="bg-stone-50 border border-stone-100 rounded-xl p-4">
        <p className="text-xs text-stone-400 mb-1">廠商代碼</p>
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-stone-800 tracking-widest font-mono">{vendor.code}</p>
          <button onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium transition-all">
            {copied ? <><Check className="w-3.5 h-3.5" />已複製</> : <><Copy className="w-3.5 h-3.5" />複製</>}
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-2">分享此代碼給成員申請加入</p>
      </div>

      {/* 管理員資訊 */}
      <div className="bg-stone-50 border border-stone-100 rounded-xl p-4">
        <p className="text-xs text-stone-400 mb-1">廠商管理員</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{(vendor.admin_name || vendor.name)?.[0]}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">{vendor.admin_name || '管理員'}</p>
            {isAdmin && <p className="text-xs text-stone-400">（您是管理員）</p>}
          </div>
        </div>
      </div>
    </div>
  );
}