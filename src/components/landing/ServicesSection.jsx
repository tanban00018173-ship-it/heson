import React, { useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import { Star, MapPin, Tag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const hotServices = [
  { name: "居家鐘點清潔", tag: "前結帳折200", tagColor: "bg-red-100 text-red-600", area: "全台本島", rating: 4.9, reviews: 2847, price: 599, img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80", service: "居家清潔" },
  { name: "冷氣深度清洗", tag: "4/30前享9折", tagColor: "bg-amber-100 text-amber-700", area: "雙北・台中・高雄", rating: 4.8, reviews: 1523, price: 1200, img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80", service: "家電清洗" },
  { name: "整理收納服務", tag: "新服務上線", tagColor: "bg-green-100 text-green-700", area: "雙北・桃園", rating: 4.9, reviews: 389, price: 1800, img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", service: "整理收納" },
  { name: "辦公室定期清潔", tag: "企業優惠", tagColor: "bg-blue-100 text-blue-700", area: "全台本島", rating: 4.8, reviews: 712, price: 2400, img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80", service: "商業清潔" },
];

const categories = [
  { name: "居家清潔", sub: "鐘點・定期・大掃除", emoji: "🏠", hot: true },
  { name: "家電清洗", sub: "冷氣・洗衣機・油煙機", emoji: "❄️", hot: false },
  { name: "整理收納", sub: "整理師・空間規劃", emoji: "📦", hot: false },
  { name: "商業清潔", sub: "辦公室・商業空間", emoji: "🏢", hot: false },
  { name: "布面清洗", sub: "沙發・床墊・窗簾", emoji: "🛋️", hot: false },
  { name: "裝潢後清潔", sub: "新屋・工程後清潔", emoji: "🔨", hot: false },
];

// Marquee ticker
function MarqueeTicker() {
  const navigate = useNavigate();
  const trackRef = useRef(null);

  return (
    <div className="overflow-hidden bg-white border-y border-stone-100 py-4 relative">
      {/* gradient fades */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      <div
        ref={trackRef}
        className="flex gap-8 animate-marquee whitespace-nowrap"
        style={{ animationDuration: '20s' }}
      >
        {[...categories, ...categories].map((cat, i) => (
          <button
            key={i}
            onClick={() => navigate(`/ServiceInquiry?service=${encodeURIComponent(cat.name)}`)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-stone-50 hover:bg-amber-50 hover:text-amber-700 text-stone-700 text-sm font-medium transition-colors border border-stone-100 hover:border-amber-200 shrink-0"
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

export default function ServicesSection() {
  const navigate = useNavigate();

  return (
    <>
      {/* Service Categories */}
      <section className="py-16 bg-stone-50">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">服務分類</span>
            <h2 className="text-3xl font-light text-stone-800 mt-3">
              六大專業 <span className="font-medium">服務項目</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <button
                  onClick={() => navigate(`/ServiceInquiry?service=${encodeURIComponent(cat.name)}`)}
                  className="w-full bg-white rounded-2xl p-5 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-stone-100 relative"
                >
                  {cat.hot && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">熱門</span>
                  )}
                  <div className="text-3xl mb-3">{cat.emoji}</div>
                  <p className="font-medium text-stone-800 text-sm">{cat.name}</p>
                  <p className="text-xs text-stone-400 mt-1">{cat.sub}</p>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee ticker */}
      <MarqueeTicker />

      {/* Hot Services */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">本月熱門</span>
            <h2 className="text-3xl font-light text-stone-800 mt-3">
              最受歡迎的 <span className="font-medium">熱門服務</span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {hotServices.map((service, i) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <button
                  onClick={() => navigate(`/ServiceInquiry?service=${encodeURIComponent(service.service)}`)}
                  className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-stone-100"
                >
                  <div className="relative">
                    <img src={service.img} alt={service.name} className="w-full h-44 object-cover" />
                    <span className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full ${service.tagColor}`}>
                      <Tag className="w-3 h-3 inline mr-1" />
                      {service.tag}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-stone-800">{service.name}</h3>
                    <div className="flex items-center gap-1 mt-1.5">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      <span className="text-xs text-stone-400">{service.area}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium text-stone-700">{service.rating}</span>
                        <span className="text-xs text-stone-400">({service.reviews.toLocaleString()}則)</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-stone-400">起</span>
                        <span className="text-base font-semibold text-amber-600"> ${service.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}