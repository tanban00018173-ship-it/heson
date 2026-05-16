import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, MessageCircle, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/lib/CartContext';

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

export default function HomeTopBar({ onChatOpen }) { // onChatOpen kept for backwards compat
  const [query, setQuery] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const navigate = useNavigate();
  const { totalCount, setOpen: setCartOpen } = useCart();
  const inputRef = useRef(null);

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
      </div>
    </div>
  );
}