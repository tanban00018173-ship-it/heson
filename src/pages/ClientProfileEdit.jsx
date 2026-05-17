import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, ChevronRight, MessageCircle } from "lucide-react";
import { useEffect, useState } from 'react';

const SECTIONS = [
  {
    key: 'profile',
    label: '我的檔案',
    items: [
      { label: '個人資訊', to: '/ClientPersonalInfo' },
      { label: '我的地址', to: '/ClientAddressList' },
      { label: '銀行帳號 / 信用卡', to: null },
    ],
  },
  {
    key: 'settings',
    label: '我的設定',
    items: [
      { label: '電子發票', to: null },
      { label: '聊聊設定', to: null },
      { label: '通知設定', to: null },
      { label: '隱私設定', to: null },
      { label: '已封鎖的用戶', to: null },
      { label: 'Language / 語言 / 语言', to: null },
    ],
  },
  {
    key: 'account',
    label: '我的帳號',
    items: [
      { label: '幫助中心', to: null },
      { label: '赫頌規範', to: null },
      { label: '赫頌生活使用規則', to: null },
      { label: '喜歡赫頌嗎？快去評價！', to: null },
      { label: '關於', to: null },
      { label: '申請刪除帳號', to: null, danger: true },
    ],
  },
];

export default function ClientProfileEdit() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      if (!auth) { base44.auth.redirectToLogin(); return; }
      base44.auth.me().then(setUser);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col">
      {/* 頂部導航 */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center sticky top-0 z-20">
        <button
          onClick={() => navigate('/ClientProfile')}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-stone-900">設定</h1>
        <Link
          to="/VendorChatPage"
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-900 hover:bg-stone-700 transition-colors"
        >
          <MessageCircle className="w-5 h-5 text-white" />
        </Link>
      </div>

      {/* 捲動內容 */}
      <div className="flex-1 overflow-y-auto pb-36">
        {SECTIONS.map(section => (
          <div key={section.key}>
            {/* 母項目標題 — 灰底，不在白卡內 */}
            <p className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">
              {section.label}
            </p>
            {/* 子項目白色列表，貼齊左右 */}
            <div className="bg-white">
              {section.items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => item.to && navigate(item.to)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors ${!item.to ? 'opacity-50 cursor-default' : ''}`}
                >
                  <span className={`text-sm font-medium ${item.danger ? 'text-red-500' : 'text-stone-800'}`}>
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 登出 */}
        <div className="px-4 pt-6 pb-4">
          <button
            onClick={() => base44.auth.logout()}
            className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl hover:bg-stone-700 transition-colors"
          >
            登出
          </button>
        </div>
      </div>

      <ClientBottomNav />
    </div>
  );
}