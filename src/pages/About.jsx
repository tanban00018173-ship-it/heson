import React from 'react';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Heart, Users, Shield, Award, CheckCircle } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "用心服務",
    description: "每一次服務都以客戶滿意為最高標準，用心呵護您的居家環境"
  },
  {
    icon: Users,
    title: "專業團隊",
    description: "嚴格篩選的家事管理師，經過完整培訓，具備專業清潔技能"
  },
  {
    icon: Shield,
    title: "安心保障",
    description: "良民證驗證、身分審核，為您提供最安心的居家服務"
  },
  {
    icon: Award,
    title: "品質承諾",
    description: "標準化 SOP 流程，確保每次服務品質一致"
  }
];

const stats = [
  { value: "1,000+", label: "滿意客戶" },
  { value: "50+", label: "專業管理師" },
  { value: "98%", label: "客戶回購率" },
  { value: "5年", label: "品牌深耕" },
];

const promises = [
  "每位管理師皆通過良民證審查",
  "服務前後拍照存檔，透明可追蹤",
  "標準化 SOP，品質穩定一致",
  "彈性訂閱方案，依需求自由調整",
];

export default function About() {
  return (
    <div className="min-h-screen bg-white font-body">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-24 bg-gradient-to-b from-stone-50 to-white relative overflow-hidden">
        {/* 裝飾金線 */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-60" />
        <div className="container mx-auto px-6 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-10 bg-amber-400" />
              <span className="text-amber-600 text-xs font-semibold tracking-[0.25em] uppercase">About HESON</span>
              <div className="h-px w-10 bg-amber-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-stone-800 leading-tight tracking-tight">
              赫頌<span className="font-semibold">家事管理</span>
            </h1>
            <p className="text-stone-500 text-lg mt-6 leading-relaxed">
              我們相信，每個人都值得擁有潔淨舒適的居家環境。
              HESON 致力於提供專業、貼心的家事管理服務，
              讓您把寶貴的時間留給更重要的人事物。
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-stone-900">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-semibold text-amber-400 font-headline">{s.value}</div>
                <div className="text-stone-400 text-sm mt-1 tracking-wide">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/246d43b9c_1.jpg"
                alt="清潔服務"
                className="rounded-2xl shadow-lg object-cover w-full h-52 md:h-64"
              />
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/55499df64_3.jpg"
                alt="居家清潔"
                className="rounded-2xl shadow-lg object-cover w-full h-52 md:h-64 mt-10"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-amber-400" />
                <span className="text-amber-600 text-xs font-semibold tracking-[0.2em] uppercase">我們的故事</span>
              </div>
              <h2 className="text-3xl font-light text-stone-800 leading-snug">
                源於對<span className="font-semibold">美好生活</span>的追求
              </h2>
              <p className="text-stone-500 mt-6 leading-relaxed">
                HESON 成立於對居家生活品質的堅持。我們深知現代人工作繁忙，
                卻渴望回到家時能享受潔淨舒適的環境。
              </p>
              <p className="text-stone-500 mt-4 leading-relaxed">
                我們的「家事管理師」不只是清潔人員，更是您居家生活的好夥伴。
                每位管理師都經過嚴格篩選與專業培訓，
                以標準化的 SOP 流程為您提供一致的高品質服務。
              </p>
              <p className="text-stone-500 mt-4 leading-relaxed">
                透過訂閱制的彈性方案，您可以依據自己的需求選擇服務頻率，
                讓專業的團隊為您打理居家環境。
              </p>

              {/* Promise list */}
              <ul className="mt-8 space-y-3">
                {promises.map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-stone-600 text-sm">{p}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-stone-50">
        <div className="container mx-auto px-6 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-amber-400" />
              <span className="text-amber-600 text-xs font-semibold tracking-[0.2em] uppercase">核心價值</span>
              <div className="h-px w-8 bg-amber-400" />
            </div>
            <h2 className="text-3xl font-light text-stone-800">
              我們的<span className="font-semibold">服務承諾</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mb-6">
                  <value.icon className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-3">{value.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Banner */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl"
            >
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/468938194_Facebook-HESON.png"
                alt="HESON 團隊"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent flex items-end">
                <div className="p-8 md:p-12">
                  <p className="text-amber-300 text-xs font-semibold tracking-widest uppercase mb-2">HESON Team</p>
                  <h3 className="text-2xl md:text-3xl font-light text-white">
                    每一位夥伴，<span className="font-semibold">都是品質的守護者</span>
                  </h3>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}