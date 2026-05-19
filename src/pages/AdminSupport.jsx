import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminBottomNav from '@/components/dashboard/AdminBottomNav';
import { Copy, CheckCheck, Search, ChevronRight, Headphones } from 'lucide-react';

const TEMPLATES = [
  {
    category: '預約問題',
    color: 'bg-blue-50 text-blue-700',
    items: [
      { label: '確認預約', text: '您好！感謝您預約赫頌管家服務。您的預約已確認，我們將在預定時間準時到達，如有任何問題歡迎隨時聯繫我們。' },
      { label: '改期通知', text: '您好！因臨時狀況，您原定的服務時間需要調整。非常抱歉造成不便，請問您方便改為哪個時段？' },
      { label: '取消說明', text: '您好！已收到您的取消申請。根據取消政策，我們將在 3-5 個工作日內完成退款。若有任何疑問歡迎再次聯繫。' },
    ]
  },
  {
    category: '服務問題',
    color: 'bg-green-50 text-green-700',
    items: [
      { label: '服務說明', text: '感謝您的詢問！赫頌管家提供居家清潔、深度清潔等多項服務，每次服務均由經過培訓的專業管理師執行，請放心。' },
      { label: '服務反饋', text: '非常感謝您的寶貴意見！我們已將您的反饋記錄，並會持續改善服務品質。若有其他需要協助的地方，請隨時告訴我們。' },
      { label: '客訴處理', text: '非常抱歉您有這樣的體驗！我們對此深感遺憾。請讓我們深入了解情況，我們會儘快為您妥善處理。' },
    ]
  },
  {
    category: '付款問題',
    color: 'bg-amber-50 text-amber-700',
    items: [
      { label: '付款確認', text: '您好！已確認收到您的付款，感謝您的信任。如需收據或發票，請告知我們您的需求。' },
      { label: '退款說明', text: '您的退款申請已受理，退款金額將退回原付款方式，處理時間約 5-7 個工作日，請耐心等候。' },
    ]
  },
  {
    category: '通用問候',
    color: 'bg-stone-50 text-stone-600',
    items: [
      { label: '歡迎問候', text: '您好！歡迎聯繫赫頌管家客服，很高興為您服務。請問有什麼可以幫助您的？' },
      { label: '等候回覆', text: '您好！感謝您的耐心等候，我們正在為您處理中，請稍等片刻。' },
      { label: '結束對話', text: '感謝您聯繫赫頌管家！祝您有美好的一天，如有需要歡迎再次聯繫我們。' },
    ]
  },
];

export default function AdminSupport() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(null);
  const [expanded, setExpanded] = useState('預約問題');

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) { base44.auth.redirectToLogin(); return; }
      base44.auth.me().then(setUser);
    });
  }, []);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = search
    ? TEMPLATES.map(cat => ({
        ...cat,
        items: cat.items.filter(i => i.label.includes(search) || i.text.includes(search))
      })).filter(cat => cat.items.length > 0)
    : TEMPLATES;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-stone-900 pt-10 pb-5 px-4 text-white">
        <p className="text-xs text-white/40 mb-1">客服中心</p>
        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5 text-white/80" />
          <p className="text-xl font-bold">客服模板</p>
        </div>
        <p className="text-sm text-white/50 mt-1">快速複製回覆模板給前台客戶</p>
      </div>

      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 bg-stone-100 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋模板..."
            className="flex-1 bg-transparent text-sm outline-none text-stone-700 placeholder:text-stone-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 px-4 space-y-2">
        {filtered.map(cat => (
          <div key={cat.category} className="bg-stone-50 rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpanded(e => e === cat.category ? null : cat.category)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>{cat.category}</span>
                <span className="text-xs text-stone-400">{cat.items.length} 個模板</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${expanded === cat.category ? 'rotate-90' : ''}`} />
            </button>
            {expanded === cat.category && (
              <div className="px-4 pb-3 space-y-2">
                {cat.items.map(item => (
                  <div key={item.label} className="bg-white rounded-xl p-3 border border-stone-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-stone-600">{item.label}</p>
                      <button
                        onClick={() => handleCopy(item.text, item.label)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors
                          ${copied === item.label ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                      >
                        {copied === item.label
                          ? <><CheckCheck className="w-3 h-3" />已複製</>
                          : <><Copy className="w-3 h-3" />複製</>
                        }
                      </button>
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <AdminBottomNav />
    </div>
  );
}