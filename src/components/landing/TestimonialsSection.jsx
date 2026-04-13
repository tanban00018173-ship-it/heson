import React from 'react';
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "張先生",
    location: "桃園市中壢區",
    service: "辦公室清潔服務",
    comment: "商業清潔服務非常專業，辦公室煥然一新！師傅動作俐落，整個流程都有照片記錄，讓我很放心。",
    rating: 5,
    avatar: "張"
  },
  {
    name: "李小姐",
    location: "高雄市前鎮區",
    service: "整理收納服務",
    comment: "整理收納服務讓我的衣帽間大變身！整理師很有耐心，幫我規劃出非常實用的收納方式，每天找衣服變得超輕鬆。",
    rating: 5,
    avatar: "李"
  },
  {
    name: "陳小姐",
    location: "台北市大安區",
    service: "家庭定期清潔",
    comment: "細心清潔而且預約流程超簡單！24小時線上預約，師傅準時到達，清潔前後照片讓我完全了解服務成果。",
    rating: 5,
    avatar: "陳"
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-amber-50/30 to-white">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">用戶心聲</span>
          <h2 className="text-3xl font-light text-stone-800 mt-3">
            來自真實客戶的 <span className="font-medium">評價</span>
          </h2>
          <p className="text-stone-500 mt-3">所有評價皆為真實用戶回饋，公開透明</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-stone-100 relative"
            >
              <Quote className="w-8 h-8 text-amber-200 absolute top-6 right-6" />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-stone-600 leading-relaxed mb-6 text-sm">"{t.comment}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-medium text-stone-800">{t.name}</p>
                  <p className="text-xs text-stone-400">{t.location} · {t.service}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}