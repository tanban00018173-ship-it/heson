import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function ServiceCard({ item, providerPhoto, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[60vw] max-w-[260px] rounded-2xl overflow-hidden text-left active:scale-95 transition-transform border border-stone-100 shadow-sm bg-white"
    >
      <div className="h-36 bg-stone-100 flex items-center justify-center relative overflow-hidden">
        {item.image_url
          ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          : <span className="text-4xl">🧹</span>
        }
        {item.badge && (
          <span className="absolute top-2 right-2 bg-white/90 text-stone-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
        )}
      </div>
      <div className="p-3 flex gap-2">
        {providerPhoto ? (
          <img src={providerPhoto} alt="" className="w-12 h-12 rounded-full object-cover border border-stone-100 flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🧹</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base text-stone-900 leading-snug line-clamp-2">{item.title}</p>
          <p className="text-xs text-stone-400 mt-0.5 leading-tight line-clamp-1">{item.subtitle}</p>
          {item.price != null && (
            <p className="text-sm font-bold text-stone-900 mt-1">NT$ {item.price.toLocaleString()} 起</p>
          )}
        </div>
      </div>
    </button>
  );
}

export default function HesonPicksSection({ sections, profiles, onTrack }) {
  const navigate = useNavigate();

  if (!sections || sections.length === 0) return null;

  return (
    <section className="bg-white mt-2 pt-5 pb-2">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-xl font-black text-stone-900 tracking-tight">Heson 精選推薦</h2>
        <button
          onClick={() => navigate('/CleanerTeam')}
          className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors flex-shrink-0"
        >
          <ArrowRight className="w-4 h-4 text-stone-700" />
        </button>
      </div>
      <div className="flex gap-3 pl-4 pr-2 overflow-x-auto pb-4 scrollbar-none">
        {sections.map(item => {
          const provider = (profiles || []).find(p => p.user_id === item.provider_id);
          return (
            <ServiceCard
              key={item.id}
              item={item}
              providerPhoto={provider?.profile_photo}
              onClick={() => {
                onTrack?.('click_card', { section_key: 'heson_picks', target_id: item.id, target_name: item.title });
                base44.entities.HomeSection.update(item.id, { click_count: (item.click_count || 0) + 1 }).catch(() => {});
                navigate('/ClientBooking');
              }}
            />
          );
        })}
      </div>
    </section>
  );
}