import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Star, ArrowRight, Shield } from 'lucide-react';

const SLIDES = [
  {
    tag: '限時優惠',
    title: '首次預約\n享 85 折',
    sub: '居家清潔・到府服務・專業認證',
    cta: '立即預約',
    route: '/ClientBooking',
    bg: 'from-gold-500 to-gold-600',
    emoji: '✨',
  },
  {
    tag: '閃電任務',
    title: '今天想要\n立刻乾淨',
    sub: '發佈任務，10 分鐘媒合，馬上到府',
    cta: '發佈任務',
    route: '/FlashTaskPost',
    bg: 'from-stone-900 to-stone-700',
    emoji: '⚡',
  },
  {
    tag: '清潔用品',
    title: '職業級清潔\n你也可以',
    sub: '專業清潔師愛用商品，直送到家',
    cta: '逛商店',
    route: '/ClientShop',
    bg: 'from-teal-500 to-cyan-600',
    emoji: '🧴',
  },
];

export default function HeroBanner() {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  const slide = SLIDES[idx];

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="px-4 pt-4 max-w-2xl mx-auto">
      {/* Main Banner */}
      <div
        className={`relative bg-gradient-to-br ${slide.bg} rounded-3xl p-5 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform duration-150`}
        onClick={() => navigate(slide.route)}
      >
        {/* Background emoji */}
        <span className="absolute right-4 top-3 text-6xl opacity-20 select-none">{slide.emoji}</span>

        <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-2 uppercase tracking-wider">
          {slide.tag}
        </span>
        <h2 className="text-white text-2xl font-black leading-tight mb-1 whitespace-pre-line">
          {slide.title}
        </h2>
        <p className="text-white/70 text-xs mb-4">{slide.sub}</p>

        <button className="inline-flex items-center gap-1.5 bg-white text-stone-900 text-sm font-bold px-4 py-2 rounded-full hover:bg-stone-100 transition-colors">
          {slide.cta} <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 right-4 flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIdx(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { icon: Star, label: '4.9 評分', sub: '1,200+ 好評' },
          { icon: Shield, label: '全程保障', sub: '意外險投保' },
          { icon: Zap, label: '極速媒合', sub: '10 分鐘確認' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="bg-white rounded-2xl p-3 text-center border border-stone-100">
            <Icon className="w-4 h-4 text-gold-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-stone-800">{label}</p>
            <p className="text-[10px] text-stone-400">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}