import React, { useState } from 'react';
import {
  User, Star, HelpCircle, MessageSquare, Camera, ChevronRight,
  Award, FileText, Settings, LogOut, Shield, BookOpen, Phone
} from 'lucide-react';
import { base44 } from "@/api/base44Client";

export default function ProfileTab({ user, cleanerProfile }) {
  const [activeSection, setActiveSection] = useState(null);

  const displayName = cleanerProfile?.nickname || user?.full_name;
  const avatarLetter = displayName?.[0]?.toUpperCase() || 'U';

  if (activeSection === 'faq') {
    const faqs = [
      { q: '如何接取閃電任務？', a: '當有即時任務發出時，地圖上會出現閃電標記，點擊後可查看詳情並接單。' },
      { q: '薪資如何計算？', a: '平台派案抽成70%，接案後系統自動計算並於月底結算。' },
      { q: '如何提升接案優先度？', a: '完成更多技能認證、維持好評率 4.8 以上、準時出勤，可獲得優先派案。' },
      { q: '任務取消如何處理？', a: '服務前24小時取消不罰款；24小時內取消依規定酌收費用。' },
      { q: '好評率如何計算？', a: '客戶完成服務後評分，過去30筆的平均分數即為您的好評率。' },
    ];
    return (
      <div className="flex-1 overflow-y-auto bg-stone-50">
        <div className="bg-white px-4 py-4 flex items-center gap-3 border-b border-stone-100">
          <button onClick={() => setActiveSection(null)}>
            <ChevronRight className="w-5 h-5 text-stone-500 rotate-180" />
          </button>
          <span className="font-semibold text-stone-800">常見問題</span>
        </div>
        <div className="p-4 space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
              <p className="text-sm font-semibold text-stone-800 mb-2">Q. {f.q}</p>
              <p className="text-sm text-stone-500 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50">
      {/* 個人頭像區 */}
      <div className="bg-gradient-to-br from-stone-800 to-stone-700 pt-8 pb-6 px-6 text-white">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center overflow-hidden">
              {cleanerProfile?.profile_photo ? (
                <img src={cleanerProfile.profile_photo} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{avatarLetter}</span>
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white">
              <Camera className="w-3 h-3 text-white" />
            </button>
          </div>
          <div>
            <p className="text-lg font-bold">{displayName || '管理師'}</p>
            <p className="text-white/60 text-sm">{user?.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-amber-400 font-semibold text-sm">4.9</span>
              <span className="text-white/40 text-xs">（52 則好評）</span>
            </div>
          </div>
        </div>

        {/* 統計卡 */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          {[
            { label: '完成任務', value: '48' },
            { label: '服務時數', value: '162h' },
            { label: '準時率', value: '98%' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-base font-bold">{value}</p>
              <p className="text-white/60 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 功能清單 */}
      <div className="p-4 space-y-2">

        {/* 作品集 */}
        <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-stone-400 uppercase tracking-wide">作品集 & 資歷</p>
          {[
            { icon: Camera, label: '上架作品集照片', desc: '展示清潔成果給客戶看', color: 'bg-purple-100 text-purple-600' },
            { icon: Award, label: '我的認證技能', desc: '查看已解鎖的技能證書', color: 'bg-amber-100 text-amber-600' },
            { icon: FileText, label: '個人資料設定', desc: '更新姓名、服務地區等', color: 'bg-blue-100 text-blue-600', to: '/CleanerProfile' },
          ].map(({ icon: Icon, label, desc, color, to }) => (
            <button
              key={label}
              onClick={() => to && (window.location.href = to)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors border-t border-stone-50"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-stone-800">{label}</p>
                <p className="text-xs text-stone-400">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </button>
          ))}
        </div>

        {/* 評價區 */}
        <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-stone-400 uppercase tracking-wide">評價與回饋</p>
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="text-2xl font-bold text-stone-800">4.9</span>
                <span className="text-stone-400 text-sm">/ 5.0</span>
              </div>
              <span className="text-xs text-stone-400">52 則評價</span>
            </div>
            {[5, 4, 3].map(stars => (
              <div key={stars} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-stone-400 w-3">{stars}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <div className="flex-1 bg-stone-100 rounded-full h-1.5">
                  <div
                    className="bg-amber-400 h-1.5 rounded-full"
                    style={{ width: stars === 5 ? '85%' : stars === 4 ? '12%' : '3%' }}
                  />
                </div>
                <span className="text-xs text-stone-400 w-6 text-right">{stars === 5 ? '44' : stars === 4 ? '6' : '2'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 說明 & 客服 */}
        <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-stone-400 uppercase tracking-wide">幫助 & 支援</p>
          {[
            { icon: HelpCircle, label: '常見問題（FAQ）', color: 'bg-green-100 text-green-600', action: () => setActiveSection('faq') },
            { icon: MessageSquare, label: '聯絡客服', color: 'bg-teal-100 text-teal-600', action: () => {} },
            { icon: Phone, label: '緊急聯絡電話', color: 'bg-red-100 text-red-600', action: () => {} },
            { icon: Shield, label: '隱私與安全設定', color: 'bg-stone-100 text-stone-600', action: () => {} },
          ].map(({ icon: Icon, label, color, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors border-t border-stone-50"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="flex-1 text-sm font-medium text-stone-800 text-left">{label}</span>
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </button>
          ))}
        </div>

        {/* 登出 */}
        <button
          onClick={() => base44.auth.logout()}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 border border-stone-100 shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-sm font-medium text-red-500">登出</span>
        </button>
      </div>
    </div>
  );
}