import React from 'react';
import { motion } from "framer-motion";
import { Users, ClipboardCheck, Camera, Shield, Clock, Heart } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "固定專人服務",
    description: "每次都是熟悉您家的管理師，了解您的需求與習慣"
  },
  {
    icon: ClipboardCheck,
    title: "標準 SOP 流程",
    description: "專業訓練的清潔流程，確保每次服務品質一致"
  },
  {
    icon: Camera,
    title: "照片回報系統",
    description: "清潔前後對比照片，讓您隨時掌握服務成果"
  },
  {
    icon: Shield,
    title: "嚴格背景審核",
    description: "良民證、身分驗證，給您最安心的居家服務"
  },
  {
    icon: Clock,
    title: "彈性時段安排",
    description: "上午、下午、晚間時段任選，配合您的生活節奏"
  },
  {
    icon: Heart,
    title: "貼心客製服務",
    description: "依據您的居家環境，提供最適合的清潔方案"
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