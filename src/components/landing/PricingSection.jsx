import React from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const plans = [
  {
    name: "基本方案",
    nameEn: "Basic",
    visits: "每月贈送 11 小時券",
    price: "999",
    perVisit: "月/元",
    discount: "95 折優惠",
    features: [
      "每月贈送 11 小時券",
      "95 折優惠",
      "優先派案",
      "專屬客服",
    ],
    popular: false
  },
  {
    name: "VIP 方案",
    nameEn: "VIP",
    visits: "每月贈送 36 小時券",
    price: "2,999",
    perVisit: "月/元",
    discount: "9 折優惠",
    features: [
      "每月贈送 36 小時券",
      "9 折優惠",
      "VIP 優先派案",
      "指定人員服務",
      "專屬客服管家",
    ],
    popular: true
  },
  {
    name: "單次清潔",
    nameEn: "Single",
    visits: "依需求選擇",
    price: "599",
    perVisit: "起/次",
    discount: "彈性不綁約",
    features: [
      "不需訂閱，彈性預約",
      "全台本島服務",
      "照片回報系統",
      "24hr 線上預約",
      "服務後可評分",
    ],
    popular: false
  }
];

export default function PricingSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-stone-50 to-white">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">
            訂閱方案
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-stone-800 mt-4">
            選擇最適合您的 <span className="font-medium">方案</span>
          </h2>
          <p className="text-stone-500 mt-4 max-w-2xl mx-auto">
            彈性訂閱制，隨時調整，給您最貼心的服務體驗
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`relative rounded-3xl p-8 ${
                plan.popular 
                  ? 'bg-stone-800 text-white shadow-2xl scale-105' 
                  : 'bg-white border border-stone-200 shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-amber-500 text-white text-xs font-medium px-4 py-1.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    最受歡迎
                  </div>
                </div>
              )}
              
              <div className="text-center mb-8">
                <p className={`text-sm font-medium ${plan.popular ? 'text-amber-400' : 'text-amber-600'}`}>
                  {plan.nameEn}
                </p>
                <h3 className={`text-2xl font-medium mt-2 ${plan.popular ? 'text-white' : 'text-stone-800'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mt-1 ${plan.popular ? 'text-stone-400' : 'text-stone-500'}`}>
                  {plan.visits}
                </p>
              </div>
              
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-sm ${plan.popular ? 'text-stone-400' : 'text-stone-500'}`}>NT$</span>
                  <span className={`text-4xl font-semibold ${plan.popular ? 'text-white' : 'text-stone-800'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.popular ? 'text-stone-400' : 'text-stone-500'}`}>{plan.perVisit}</span>
                </div>
                <p className={`text-xs mt-2 px-3 py-1 rounded-full inline-block font-medium ${plan.popular ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600'}`}>
                  {plan.discount}
                </p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      plan.popular ? 'bg-amber-500' : 'bg-amber-100'
                    }`}>
                      <Check className={`w-3 h-3 ${plan.popular ? 'text-white' : 'text-amber-600'}`} />
                    </div>
                    <span className={`text-sm ${plan.popular ? 'text-stone-300' : 'text-stone-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Link to={createPageUrl("BookingForm")}>
                <Button 
                  className={`w-full py-6 rounded-xl font-medium ${
                    plan.popular 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                      : 'bg-stone-800 hover:bg-stone-900 text-white'
                  }`}
                >
                  立即訂閱
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
        
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-stone-400 text-sm mt-12"
        >
          * 每月自動扣款，隨時可取消，無合約綁定，不收違約金。依《消費者保護法》規範，訂閱費用非儲值款項。
        </motion.p>
      </div>
    </section>
  );
}