import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Heart, Trash2, ShoppingBag } from 'lucide-react';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function ClientFavorites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (ok) => {
      if (!ok) { navigate('/'); return; }
      const u = await base44.auth.me();
      setUser(u);
    });
  }, []);

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['serviceFavorites', user?.id],
    queryFn: () => base44.entities.ServiceFavorite.filter({ user_id: user.id }, '-created_date'),
    enabled: !!user,
  });

  const removeFav = async (fav) => {
    await base44.entities.ServiceFavorite.delete(fav.id);
    queryClient.invalidateQueries({ queryKey: ['serviceFavorites', user?.id] });
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          <h1 className="text-base font-bold text-stone-900">我的收藏</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-28">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-stone-200 border-t-red-500 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && favorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-stone-300">
            <Heart className="w-14 h-14 mb-3 opacity-40" />
            <p className="text-sm text-stone-400">尚未收藏任何服務</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-stone-900 text-white text-sm rounded-full font-medium"
            >
              去逛逛服務
            </button>
          </div>
        )}

        {!isLoading && favorites.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map(fav => (
              <div key={fav.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex flex-col">
                <div className="relative h-32 bg-stone-100">
                  {fav.image_url
                    ? <img src={fav.image_url} alt={fav.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl">🧹</div>}
                  {fav.badge && (
                    <span className="absolute top-2 right-2 bg-white/90 text-stone-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{fav.badge}</span>
                  )}
                  <button
                    onClick={() => removeFav(fav)}
                    className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 shadow-sm text-red-500 hover:bg-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <p className="font-bold text-sm text-stone-900 leading-snug line-clamp-2">{fav.title}</p>
                  {fav.subtitle && <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{fav.subtitle}</p>}
                  {fav.price != null && (
                    <p className="text-sm font-bold text-stone-900 mt-1">NT$ {fav.price.toLocaleString()} 起</p>
                  )}
                  <button
                    onClick={() => navigate('/ClientBooking')}
                    className="mt-2 w-full bg-stone-900 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> 立即預約
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ClientBottomNav />
    </div>
  );
}