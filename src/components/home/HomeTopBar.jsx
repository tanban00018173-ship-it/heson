import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, MessageCircle, X, LayoutGrid } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/lib/CartContext';
import { base44 } from '@/api/base44Client';

// keyword → route mapping
const SEARCH_ROUTES = [
  { keywords: ['清潔', '打掃', '居家', '鐘點', '大掃除', '定期'], route: '/ServiceInquiry?service=居家清潔' },
  { keywords: ['冷氣', '洗衣機', '油煙機', '家電'], route: '/ServiceInquiry?service=家電清洗' },
  { keywords: ['整理', '收納', '空間'], route: '/ServiceInquiry?service=整理收納' },
  { keywords: ['辦公室', '商業', '公司'], route: '/ServiceInquiry?service=商業清潔' },
  { keywords: ['沙發', '床墊', '窗簾', '布面'], route: '/ServiceInquiry?service=布面清洗' },
  { keywords: ['裝潢', '新屋', '工程'], route: '/ServiceInquiry?service=裝潢後清潔' },
  { keywords: ['商品', '購買', '清潔劑', '用品', '商店', '商店'], route: '/ClientShop' },
  { keywords: ['預約', '方案', '訂閱', '費用', '價格'], route: '/ClientBooking' },
  { keywords: ['閃電', '即時', '緊急', '快速', '任務'], route: '/FlashTaskPost' },
];

function resolveRoute(query) {
  if (!query.trim()) return null;
  for (const { keywords, route } of SEARCH_ROUTES) {
    if (keywords.some(kw => query.includes(kw))) return route;
  }
  // fallback: generic service inquiry
  return `/ServiceInquiry?q=${encodeURIComponent(query)}`;
}

const PORTAL_LINKS = [
  { label: '後台', path: '/AdminDashboard', roles: ['admin'], color: 'bg-red-500' },
  { label: '中台', path: '/CleanerJobs',    roles: ['admin', 'cleaner'], color: 'bg-blue-500' },
];

export default function HomeTopBar({ onChatOpen }) { // onChatOpen kept for backwards compat
  const [query, setQuery] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [portalOpen, setPortalOpen] = useState(false);
  const navigate = useNavigate();
  const { totalCount, setOpen: setCartOpen } = useCart();
  const inputRef = useRef(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (ok) base44.auth.me().then(u => setUserRole(u?.role));
    });
  }, []);

  const visiblePortals = PORTAL_LINKS.filter(p => p.roles.includes(userRole));

  useEffect(() => {
    if (!query.trim()) { setSuggestion(''); return; }
    const route = resolveRoute(query);
    if (route) {
      if (route.includes('ServiceInquiry')) {
        const svc = new URLSearchParams(route.split('?')[1]).get('service');
        setSuggestion(svc ? `前往「${svc}」服務` : '搜尋服務');
      } else if (route.includes('ClientShop')) {
        setSuggestion('前往商店');
      } else if (route.includes('FlashTaskPost')) {
        setSuggestion('發佈即時任務');
      } else if (route.includes('ClientBooking')) {
        setSuggestion('前往預約');
      } else {
        setSuggestion('搜尋');
      }
    }
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    const route = resolveRoute(query);
    if (route) navigate(route);
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-stone-100 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center gap-2">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜尋服務或商品…"
            className="w-full pl-9 pr-10 py-2.5 text-sm bg-stone-100 rounded-2xl outline-none focus:bg-stone-50 focus:ring-2 focus:ring-gold-300 transition-all"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-stone-400" />
            </button>
          )}
          {/* suggestion pill */}
          {suggestion && (
            <button
              type="submit"
              className="absolute left-9 top-full mt-1.5 bg-gold-50 border border-gold-200 text-gold-700 text-xs px-3 py-1 rounded-full font-medium hover:bg-gold-100 transition-colors z-10 whitespace-nowrap shadow-sm"
            >
              {suggestion} →
            </button>
          )}
        </form>

        {/* Cart */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-100 hover:bg-stone-200 transition-colors"
        >
          <ShoppingCart className="w-5 h-5 text-stone-700" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
        </button>

        {/* Chat → VendorChat */}
        <Link
          to="/VendorChatPage"
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-900 hover:bg-stone-700 transition-colors"
        >
          <MessageCircle className="w-5 h-5 text-white" />
        </Link>

        {/* Portal Switcher — admin/cleaner only */}
        {visiblePortals.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setPortalOpen(o => !o)}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-800 hover:bg-stone-700 transition-colors"
              title="台端切換"
            >
              <LayoutGrid className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
            </button>
            {portalOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPortalOpen(false)} />
                <div className="absolute top-full mt-1.5 right-0 z-50 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden min-w-[120px]">
                  {visiblePortals.map(p => (
                    <button
                      key={p.path}
                      onClick={() => { navigate(p.path); setPortalOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold hover:bg-stone-50 transition-colors text-left text-stone-700"
                    >
                      <span className={`w-2 h-2 rounded-full ${p.color}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}