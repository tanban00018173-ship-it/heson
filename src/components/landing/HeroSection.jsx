import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Shield, Briefcase, ArrowRight, ChevronRight, UtensilsCrossed, Trash2, WashingMachine, Package } from 'lucide-react';
import { requireAuth } from '@/utils/requireAuth';

const FLASH_TASKS = [
  { id: 'dishes',   Icon: UtensilsCrossed, label: '洗碗',   base: 200 },
  { id: 'trash',    Icon: Trash2,          label: '倒垃圾', base: 150 },
  { id: 'laundry',  Icon: WashingMachine,  label: '洗曬衣', base: 250 },
  { id: 'moving',   Icon: Package,         label: '微清運', base: 350 },
];

const FEATURES = [
  { Icon: Zap,      title: '極速媒合', desc: '方圓 3 公里內人員即刻救援，10 分鐘內確認接單。' },
  { Icon: Shield,   title: '資金擔保', desc: '任務完工確認無誤，平台才會撥款，品質有保障。' },
  { Icon: Briefcase, title: '訂閱/單次隨選', desc: '從百元微任務到專業大掃除，彈性滿足所有日常。' },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [price, setPrice] = useState(200);

  const handleSelect = (task) => {
    setSelected(task.id);
    setPrice(task.base);
  };

  const handlePost = async () => {
    const ok = await requireAuth(navigate, 'FlashTaskPost');
    if (ok) navigate('/FlashTaskPost' + (selected ? `?task=${selected}&price=${price}` : ''));
  };

  const handleBooking = async () => {
    const ok = await requireAuth(navigate, 'ClientBooking');
    if (ok) navigate('/ClientBooking');
  };

  const currentTask = FLASH_TASKS.find(t => t.id === selected);

  return (
    <div>
      {/* ── Hero 主視覺 ── */}
      <section className="relative min-h-screen bg-[#0d0d0d] overflow-hidden flex flex-col">
        {/* 背景光暈 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-[80px]" />
        </div>

        {/* 網格背景 */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center py-24 pt-32">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5" />
            隨選家務平台 · 閃電媒合
          </motion.div>

          {/* 大標題 */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight max-w-4xl mb-4">
            赫頌 HESON
            <br />
            <span className="text-amber-400">你的隨選</span>
            <br />
            生活小幫手
          </motion.h1>

          {/* 副標題 */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.25 }}
            className="text-stone-400 text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
            用叫車的速度解決家務。<br />
            洗碗、倒垃圾、微清運，<span className="text-white font-semibold">NT$200 起</span>，閃電隨叫隨到。
          </motion.p>

          {/* ── 閃電任務卡片 ── */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
            className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 mb-6">

            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4 text-left">選擇任務類型</p>

            {/* 任務 Grid */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {FLASH_TASKS.map(task => (
                <button key={task.id} onClick={() => handleSelect(task)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                    selected === task.id
                      ? 'border-amber-400 bg-amber-400/15'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}>
                  <task.Icon className={`w-6 h-6 ${selected === task.id ? 'text-amber-400' : 'text-stone-400'}`} />
                  <span className={`text-xs font-medium ${selected === task.id ? 'text-amber-300' : 'text-stone-400'}`}>{task.label}</span>
                </button>
              ))}
            </div>

            {/* 價格調整 */}
            {selected && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4">
                <p className="text-xs text-stone-400 mb-2 text-left">任務金額（可加價提高媒合速度）</p>
                <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3">
                  <button onClick={() => setPrice(p => Math.max(currentTask.base, p - 50))}
                    className="w-9 h-9 rounded-xl bg-white/10 text-white text-lg font-bold hover:bg-white/20 transition-colors flex items-center justify-center">−</button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-black text-white">NT${price}</span>
                  </div>
                  <button onClick={() => setPrice(p => p + 50)}
                    className="w-9 h-9 rounded-xl bg-amber-500 text-white text-lg font-bold hover:bg-amber-400 transition-colors flex items-center justify-center">+</button>
                </div>
                <p className="text-[10px] text-stone-500 mt-1.5 text-center">底價 NT${currentTask.base}，加價可加速媒合</p>
              </motion.div>
            )}

            {/* CTA */}
            <button onClick={handlePost} disabled={!selected}
              className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 ${
                selected
                  ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.4)]'
                  : 'bg-white/10 text-stone-500 cursor-not-allowed'
              }`}>
              {selected ? (
                <><Zap className="w-5 h-5" />確認 NT${price} · 尋找小幫手</>
              ) : (
                '請先選擇任務類型'
              )}
            </button>
          </motion.div>

          {/* 次要 CTA */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-3 justify-center">
            <button onClick={handleBooking}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-full px-6 py-2.5 text-sm font-medium transition-colors">
              預約專業清潔 <ChevronRight className="w-4 h-4" />
            </button>
            <a href="https://lin.ee/xKVxq7Y" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-stone-400 hover:text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors">
              查看訂閱方案 <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* 統計數字 */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="flex items-center gap-8 mt-16">
            {[['58,000+', '媒合戶數'], ['56,000+', '真實評價'], ['679+', '認證人員']].map(([num, label]) => (
              <div key={label} className="text-center">
                <p className="text-xl md:text-2xl font-black text-white">{num}</p>
                <p className="text-xs text-stone-500 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="bg-[#111] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest text-center mb-4">為什麼選擇赫頌</p>
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-12">平台三大保障</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-amber-500/30 transition-colors">
                <div className="w-12 h-12 bg-amber-500/15 rounded-2xl flex items-center justify-center mb-4">
                  <f.Icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}