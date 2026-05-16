import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, HelpCircle, MessageSquare, Camera, ChevronRight, Award, FileText, LogOut, Shield, Phone, LayoutDashboard, Users, Zap } from 'lucide-react';
import { base44 } from "@/api/base44Client";

const MIN_REVIEWS = 50;

function calcApproval(thumbsUp = 0, thumbsDown = 0) {
  const total = thumbsUp + thumbsDown;
  if (total < MIN_REVIEWS) return { rate: 100, total, insufficient: true };
  return { rate: Math.round((thumbsUp / total) * 100), total, insufficient: false };
}

export default function ProfileTab({ user, cleanerProfile, stats = {} }) {
  const [activeSection, setActiveSection] = useState(null);

  const displayName = cleanerProfile?.nickname || user?.full_name;
  const avatarLetter = displayName?.[0]?.toUpperCase() || 'U';

  // 由外部 stats props 傳入，預設皆為 0（待串接）
  const completedTasks = stats.completedTasks ?? 0;
  const serviceHours   = stats.serviceHours   ?? 0;
  const onTimeRate     = stats.onTimeRate      ?? null; // null = 尚無資料
  const thumbsUp       = stats.thumbsUp        ?? 0;
  const thumbsDown     = stats.thumbsDown      ?? 0;

  const { rate, total, insufficient } = calcApproval(thumbsUp, thumbsDown);

  if (activeSection === 'faq') {
    const faqs = [
      { q: '如何接取閃電任務？', a: '當有即時任務發出時，地圖上會出現閃電標記，點擊後可查看詳情並接單。' },
      { q: '薪資如何計算？', a: '平台派案抽成70%，接案後系統自動計算並於月底結算。' },
      { q: '如何提升接案優先度？', a: '完成更多技能認證、維持好評率 4.8 以上、準時出勤，可獲得優先派案。' },
      { q: '任務取消如何處理？', a: '服務前24小時取消不罰款；24小時內取消依規定酌收費用。' },
      { q: '好評率如何計算？', a: '客戶給予讚/倒讚，累積 50 筆後顯示實際好評率，未達前對外顯示 100%。' },
    ];
    return (
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="bg-white px-4 py-4 flex items-center gap-3 border-b border-stone-100">
          <button onClick={() => setActiveSection(null)}>
            <ChevronRight className="w-5 h-5 text-stone-400 rotate-180" />
          </button>
          <span className="font-semibold text-stone-800">常見問題</span>
        </div>
        <div className="p-4 space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="bg-stone-50 rounded-xl p-4 border border-stone-100">
              <p className="text-sm font-semibold text-stone-800 mb-2">Q. {f.q}</p>
              <p className="text-sm text-stone-500 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* 個人頭像區 */}
      <div className="bg-black pt-8 pb-6 px-6 text-white">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-stone-700 flex items-center justify-center overflow-hidden border-2 border-white/20">
              {cleanerProfile?.profile_photo ? (
                <img src={cleanerProfile.profile_photo} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{avatarLetter}</span>
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center border border-stone-200">
              <Camera className="w-3 h-3 text-black" />
            </button>
          </div>
          <div>
            <p className="text-lg font-bold">{displayName || '管理師'}</p>
            <p className="text-white/40 text-sm">{user?.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-white font-semibold text-sm">{rate}%</span>
              <ThumbsUp className="w-3.5 h-3.5 text-white fill-white" />
              <span className="text-white/30 text-xs">
                {total === 0
                  ? '（尚無評價）'
                  : insufficient
                    ? `（${total} 筆，累積中）`
                    : `（${total} 筆評價）`}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5">
          {[
            { label: '完成任務', value: completedTasks > 0 ? String(completedTasks) : '—' },
            { label: '服務時數', value: serviceHours > 0 ? `${serviceHours}h` : '—' },
            { label: '準時率',   value: onTimeRate != null ? `${onTimeRate}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-base font-bold">{value}</p>
              <p className="text-white/40 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2">
        {/* 作品集 */}
        <div className="bg-white rounded-xl overflow-hidden border border-stone-100">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">作品集 & 資歷</p>
          {[
            { icon: Camera, label: '上架作品集照片', desc: '展示清潔成果給客戶看' },
            { icon: Award, label: '我的認證技能', desc: '查看已解鎖的技能證書' },
            { icon: FileText, label: '個人資料設定', desc: '更新姓名、服務地區等', to: '/CleanerProfile' },
          ].map(({ icon: Icon, label, desc, to }) => (
            <button key={label} onClick={() => to && (window.location.href = to)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors border-t border-stone-50">
              <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-stone-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-stone-800">{label}</p>
                <p className="text-xs text-stone-400">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </button>
          ))}
        </div>

        {/* 評價 */}
        <div className="bg-white rounded-xl overflow-hidden border border-stone-100">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">評價與回饋</p>
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-stone-800">{rate}%</span>
                <ThumbsUp className="w-5 h-5 text-stone-800 fill-stone-800" />
                <span className="text-stone-400 text-sm">好評率</span>
              </div>
              <span className="text-xs text-stone-400">{total} 筆評價</span>
            </div>

            {total === 0 ? (
              <p className="text-xs text-stone-400 text-center py-2">尚無評價紀錄</p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                  <div className="flex-1 bg-stone-100 rounded-full h-2">
                    <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${total ? (thumbsUp / total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-stone-400 w-5 text-right">{thumbsUp}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <ThumbsDown className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                  <div className="flex-1 bg-stone-100 rounded-full h-2">
                    <div className="bg-stone-400 h-2 rounded-full transition-all" style={{ width: `${total ? (thumbsDown / total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-stone-400 w-5 text-right">{thumbsDown}</span>
                </div>
              </>
            )}

            {insufficient && total > 0 && (
              <div className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-400">
                累積評價未達 {MIN_REVIEWS} 筆，對外暫顯示 <span className="font-semibold text-stone-600">100%</span> 好評率
              </div>
            )}
          </div>
        </div>

        {/* 幫助 */}
        <div className="bg-white rounded-xl overflow-hidden border border-stone-100">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">幫助 & 支援</p>
          {[
            { icon: HelpCircle, label: '常見問題（FAQ）', action: () => setActiveSection('faq') },
            { icon: MessageSquare, label: '聯絡客服', action: () => {} },
            { icon: Phone, label: '緊急聯絡電話', action: () => {} },
            { icon: Shield, label: '隱私與安全設定', action: () => {} },
          ].map(({ icon: Icon, label, action }) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors border-t border-stone-50">
              <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-stone-600" />
              </div>
              <span className="flex-1 text-sm font-medium text-stone-800 text-left">{label}</span>
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </button>
          ))}
        </div>

        {/* 台端切換（僅 admin 可見） */}
        {user?.role === 'admin' && (
          <div className="bg-white rounded-xl overflow-hidden border border-gold-200">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gold-600 uppercase tracking-wider">台端切換</p>
            {[
              { icon: LayoutDashboard, label: '後台管理', desc: '訂單、派案、報表', to: '/AdminDashboard' },
              { icon: Users, label: '前台（客戶端）', desc: '客戶首頁與服務', to: '/Home' },
            ].map(({ icon: Icon, label, desc, to }) => (
              <button key={label} onClick={() => window.location.href = to}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gold-50 transition-colors border-t border-stone-50">
                <div className="w-9 h-9 rounded-lg bg-gold-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gold-700" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-stone-800">{label}</p>
                  <p className="text-xs text-stone-400">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gold-400" />
              </button>
            ))}
          </div>
        )}

        {/* 登出 */}
        <button onClick={() => base44.auth.logout()}
          className="w-full bg-white rounded-xl p-4 flex items-center gap-3 border border-stone-100 hover:bg-stone-50 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-stone-500" />
          </div>
          <span className="text-sm font-medium text-stone-600">登出</span>
        </button>
      </div>
    </div>
  );
}