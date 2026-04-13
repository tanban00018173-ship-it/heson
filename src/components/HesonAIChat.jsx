import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const WELCOME = '您好！我是小赫 🏠 HESON 的 AI 客服助理，我可以回答問題，也可以幫您直接完成預約！';

const QUICK_QUESTIONS = [
  '我要預約服務',
  '服務費用怎麼算？',
  '服務人員有經過審核嗎？',
  '服務區域有哪些？',
];

export default function HesonAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    const history = messages.filter(m => m.role !== 'system');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await base44.functions.invoke('hesonAI', {
        message: msg,
        history: history.map(m => ({ role: m.role, content: m.content })),
      });
      const reply = res.data?.reply || '抱歉，我暫時無法回答，請撥打 0906-991-023 聯繫客服。';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

      const bd = res.data?.booking_data;
      if (bd && bd.client_name && bd.phone && bd.address && bd.service_type && bd.scheduled_date && bd.time_slot) {
        setBookingResult('loading');
        const isAuth = await base44.auth.isAuthenticated();
        const user = isAuth ? await base44.auth.me() : null;
        const booking = await base44.entities.Booking.create({
          client_id: user?.id || 'guest',
          client_name: bd.client_name,
          service_type: bd.service_type,
          status: '待確認',
          scheduled_date: bd.scheduled_date,
          time_slot: bd.time_slot,
          address: bd.address,
          notes: `電話: ${bd.phone} (由小赫 AI 協助預約)`,
        });
        setBookingResult({ id: booking.id, ...bd });
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，目前連線異常，請稍後再試或撥打 0906-991-023。' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-4 z-50 w-14 h-14 bg-amber-500 hover:bg-amber-600 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 overflow-hidden"
        aria-label="開啟小赫 AI 客服"
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <img src="https://media.base44.com/images/public/6945eea24a533fe8f1a31e80/08fd95ace_generated_image.png" alt="小赫" className="w-10 h-10 object-cover rounded-full" />
        }
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold text-white">AI</span>
        )}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-stone-100"
            style={{ width: 'min(360px, calc(100vw - 32px))', height: 'min(480px, calc(100vh - 160px))' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20">
                <img src="https://media.base44.com/images/public/6945eea24a533fe8f1a31e80/08fd95ace_generated_image.png" alt="小赫" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">小赫 AI 客服</p>
                <p className="text-amber-100 text-xs">HESON 赫頌 · 24hr 智能回覆</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-stone-50">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 overflow-hidden bg-amber-100">
                      <img src="https://media.base44.com/images/public/6945eea24a533fe8f1a31e80/08fd95ace_generated_image.png" alt="小赫" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-amber-500 text-white rounded-br-sm'
                      : 'bg-white text-stone-700 shadow-sm rounded-bl-sm border border-stone-100'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-amber-100">
                    <img src="https://media.base44.com/images/public/6945eea24a533fe8f1a31e80/08fd95ace_generated_image.png" alt="小赫" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-stone-100">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  </div>
                </div>
              )}
              {/* Booking success card */}
              {bookingResult === 'loading' && (
                <div className="flex justify-center py-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    正在建立預約中...
                  </div>
                </div>
              )}
              {bookingResult && bookingResult !== 'loading' && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    預約已建立！
                  </div>
                  <p className="text-xs text-stone-600">服務日期：{bookingResult.scheduled_date}</p>
                  <p className="text-xs text-stone-600">時段：{bookingResult.time_slot}</p>
                  <p className="text-xs text-stone-500 mt-1">客服將於 24 小時內與您確認。</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick Questions (only on first message) */}
            {messages.length === 1 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-stone-50">
                {QUICK_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs bg-white border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full hover:bg-amber-50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 border-t border-stone-100 bg-white flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="輸入您的問題..."
                className="flex-1 text-sm border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-amber-400 transition-colors"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}