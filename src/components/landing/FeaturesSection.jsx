import React from 'react';
import { motion } from "framer-motion";
import { Users, ClipboardCheck, Camera, Shield, Clock, Heart } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "24hr 線上預約",
    description: "六大服務類型線上選擇，所有流程在平台留存紀錄，隨時查閱"
  },
  {
    icon: Users,
    title: "專人快速回覆",
    description: "預約成功後 24hr 內回覆確認，系統智能派案不讓您久等"
  },
  {
    icon: Camera,
    title: "照片回報系統",
    description: "清潔前後對比照片透明公開，讓您隨時掌握服務成果"
  },
  {
    icon: Shield,
    title: "嚴格背景審核",
    description: "良民證、身分驗證，所有管理師皆經嚴格篩選，給您最安心的服務"
  },
  {
    icon: ClipboardCheck,
    title: "評價完整公開透明",
    description: "網友真實評價公開顯示，服務完成後可評分，誠信透明"
  },
  {
    icon: Heart,
    title: "智能推薦方案",
    description: "AI 分析您的居家狀況與需求，推薦最適合的服務方案"
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">
            我們的優勢
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-stone-800 mt-4">
            為什麼選擇 <span className="font-medium">HESON</span>
          </h2>
          <p className="text-stone-500 mt-4 max-w-2xl mx-auto">
            專業、用心、值得信賴，讓您享受真正的居家生活品質
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-8 rounded-3xl bg-stone-50/50 hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-stone-100"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-medium text-stone-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-stone-500 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}