import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * 收藏按鈕 — 可置於服務卡片上，點擊切換收藏狀態
 * item: HomeSection 物件（需含 id）
 */
export default function FavoriteButton({ item, className = '' }) {
  const [user, setUser] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    base44.auth.isAuthenticated().then(async (ok) => {
      if (!ok) return;
      try {
        const u = await base44.auth.me();
        if (!mounted) return;
        setUser(u);
        const favs = await base44.entities.ServiceFavorite.filter({ user_id: u.id, section_id: item.id });
        if (mounted) setFavorited(favs.length > 0);
      } catch {}
    });
    return () => { mounted = false; };
  }, [item.id]);

  const toggle = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user || loading) return;
    setLoading(true);
    try {
      if (favorited) {
        const favs = await base44.entities.ServiceFavorite.filter({ user_id: user.id, section_id: item.id });
        if (favs[0]) await base44.entities.ServiceFavorite.delete(favs[0].id);
        setFavorited(false);
      } else {
        await base44.entities.ServiceFavorite.create({
          user_id: user.id,
          section_id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          price: item.price,
          image_url: item.image_url,
          badge: item.badge,
          provider_id: item.provider_id,
          provider_type: item.provider_type,
        });
        setFavorited(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors disabled:opacity-50 ${favorited ? 'text-red-500' : 'text-stone-500 hover:text-stone-700'} ${className}`}
      aria-label={favorited ? '取消收藏' : '加入收藏'}
    >
      <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500' : ''}`} />
    </button>
  );
}