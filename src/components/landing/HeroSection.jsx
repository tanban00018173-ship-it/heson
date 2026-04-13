import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-stone-200/30 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Announcement banner */}
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-200 px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">🎉 新會員首次預約享 85 折優惠（限時活動）</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-stone-600 font-medium">空下雙手，陪伴家人</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-stone-800 leading-tight tracking-tight">
              把時間留給
              <span className="block font-medium text-stone-900">家人</span>
              <span className="block text-amber-700/90">把清潔交給我們</span>
            </h1>
            
            <p className="text-lg text-stone-600 max-w-md leading-relaxed">
              HESON 台灣最專業的家事服務媒合平台，提供居家清潔・家電清洗・整理收納・商業清潔，全台本島 24 小時線上預約。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={createPageUrl("BookingForm")}>
                <Button 
                  size="lg" 
                  className="bg-stone-800 hover:bg-stone-900 text-white px-8 py-6 text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  立即預約試掃
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="https://lin.ee/xKVxq7Y" target="_blank" rel="noopener noreferrer">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-stone-300 text-stone-700 hover:bg-stone-100 px-8 py-6 text-base rounded-full"
                >
                  LINE 諮詢
                </Button>
              </a>
              <a href="tel:0906991023">
                <Button variant="ghost" size="lg" className="text-stone-500 px-4 py-6 rounded-full">
                  <Phone className="w-4 h-4 mr-2" />
                  0906-991-023
                </Button>
              </a>
            </div>
          </motion.div>
          
          {/* Right Image Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/a31875814__B3LoM8YEjp6QCYXCqWK6--_aYdkh9q56vtKjMIul8B3FlYCAvYZXxq8V1MBtnRkPAGHVALGVikIixGs9qMn0t_Gk4gl0UxKpZ_Q7qqYyocQtdIYpmXL1ApFq_Mvs8ZokCPUNF5rJUTpUxwFl42Qjw.jpg"
                    alt="清潔服務"
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="rounded-3xl overflow-hidden shadow-xl">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/55499df64_3.jpg"
                    alt="浴室清潔"
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="rounded-3xl overflow-hidden shadow-xl">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/246d43b9c_1.jpg"
                    alt="專業清潔"
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/546f6c77d_2.jpg"
                    alt="居家整潔"
                    className="w-full h-48 object-cover"
                  />
                </div>
              </div>
            </div>
            
            {/* Floating Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-5 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-stone-800">2,800+</p>
                  <p className="text-sm text-stone-500">真實評價</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}