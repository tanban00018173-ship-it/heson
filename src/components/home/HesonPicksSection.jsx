import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

function ServicePickCard({ service, onTrack, onClick }) {
  return (
    <button
      onClick={() => {
        onTrack?.('click_card', { section_key: 'heson_picks', target_id: service.id, target_name: service.title });
        onClick?.();
      }}
      className="flex-shrink-0 w-[55vw] max-w-[240px] rounded-2xl border border-stone-100 shadow-sm bg-white text-left active:scale-95 transition-transform overflow-hidden"
    >
      {/* 上方淺灰圖片區 */}
      <div className="relative mx-3 mt-3 rounded-xl bg-stone-100 h-36 flex items-center justify-center overflow-hidden">
        {service.image_url
          ? <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
          : <span className="text-5xl opacity-30">🧹</span>
        }
        {service.badge && (
          <span className="absolute top-2 left-2 bg-stone-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{service.badge}</span>
        )}
      </div>

      {/* 下方文字區 */}
      <div className="px-3 py-3">
        <p className="font-bold text-sm text-stone-900 leading-tight line-clamp-2">{service.title}</p>
        {service.subtitle && (
          <p className="text-[11px] text-stone-400 mt-0.5 leading-tight line-clamp-1">{service.subtitle}</p>
        )}
        {service.price != null && (
          <p className="font-black text-stone-900 text-sm mt-2 leading-none">
            NT${service.price.toLocaleString()}
            <span className="text-[10px] font-normal text-stone-400 ml-1">起</span>
          </p>
        )}
      </div>
    </button>
  );
}

export default function HesonPicksSection({ services, onTrack }) {
  const navigate = useNavigate();

  if (!services || services.length === 0) return null;

  return (
    <section className="bg-white mt-2 pt-5 pb-2">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-xl font-black text-stone-900 tracking-tight">Heson 精選推薦</h2>
        <button
          onClick={() => navigate('/ClientBooking')}
          className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors flex-shrink-0"
        >
          <ArrowRight className="w-4 h-4 text-stone-700" />
        </button>
      </div>
      <div className="flex gap-3 pl-4 pr-2 overflow-x-auto pb-4 scrollbar-none">
        {services.map(service => (
          <ServicePickCard
            key={service.id}
            service={service}
            onTrack={onTrack}
            onClick={() => navigate('/ClientBooking')}
          />
        ))}
      </div>
    </section>
  );
}