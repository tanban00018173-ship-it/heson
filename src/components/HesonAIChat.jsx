import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle2, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CalendarExportButton from '@/components/CalendarExportButton';

const WELCOME = '您好！我是小赫 🏠 HESON 的 AI 客服助理，我可以回答問題，也可以幫您直接完成預約！';

const QUICK_QUESTIONS = [
  '我要預約服務',
  '服務費用怎麼算？',
  '服務人員有經過審核嗎？',
  '服務區域有哪些？',
];

const SERVICE_TYPES = ['單次清潔', '基礎月護-4次', '進階月安-8次', '尊寵月怡-12次'];
const TIME_SLOTS = ['上午 08:00-12:00', '下午 13:00-17:00', '晚間 18:00-21:00'];

const TAIWAN_CITIES = [
  '台北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣',
  '苗栗縣', '台中市', '彰化縣', '南投縣', '雲林縣', '嘉義市',
  '嘉義縣', '台南市', '高雄市', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣',
];

// Booking steps: service → city → road → date → time → name → phone → confirm
const BOOKING_STEPS = ['service', 'city', 'road', 'date', 'time', 'name', 'phone', 'confirm'];

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export default function HesonAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [quickShown, setQuickShown] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingStep, setBookingStep] = useState(null); // null = normal chat
  const [bookingData, setBookingData] = useState({});
  const bottomRef = useRef(null);
  const dateInputRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, bookingStep]);

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content }]);
  };

  const handleQuickClick = (text) => {
    if (text === '我要預約服務') {
      addMessage('user', '我要預約服務');
      addMessage('assistant', '好的！請選擇您需要的服務類型：');
      setBookingStep('service');
      setBookingData({});
    } else {
      sendChat(text);
    }
  };

  const handleBookingStep = (value, label) => {
    const step = bookingStep;
    const newData = { ...bookingData };

    if (step === 'service') {
      newData.service_type = value;
      addMessage('user', value);
      addMessage('assistant', '請選擇服務縣市：');
      setBookingData(newData);
      setBookingStep('city');
    } else if (step === 'city') {
      newData.city = value;
      addMessage('user', value);
      addMessage('assistant', `已選擇 ${value}，請輸入詳細路名與門牌號碼（例：中山北路二段100號）：`);
      setBookingData(newData);
      setBookingStep('road');
    } else if (step === 'date') {
      const [yyyy, mm, dd] = value.split('-');
      const weekday = ['日','一','二','三','四','五','六'][new Date(value).getDay()];
      newData.scheduled_date = value;
      addMessage('user', `${mm}/${dd}（週${weekday}）`);
      addMessage('assistant', '請選擇希望的服務時段：');
      setBookingData(newData);
      setBookingStep('time');
    } else if (step === 'time') {
      newData.time_slot = value;
      addMessage('user', value);
      addMessage('assistant', '請問您的姓名是？');
      setBookingData(newData);
      setBookingStep('name');
    }
  };

  const handleTextInput = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    if (bookingStep === 'road') {
      const newData = { ...bookingData, address: `${bookingData.city || ''}${text}` };
      addMessage('user', text);
      addMessage('assistant', '請選擇希望的服務日期：');
      setBookingData(newData);
      setBookingStep('date');
    } else if (bookingStep === 'name') {
      const newData = { ...bookingData, client_name: text };
      addMessage('user', text);
      addMessage('assistant', '請輸入您的聯絡電話：');
      setBookingData(newData);
      setBookingStep('phone');
    } else if (bookingStep === 'phone') {
      const newData = { ...bookingData, phone: text };
      addMessage('user', text);
      addMessage('assistant',
        `✅ 請確認您的預約資訊：\n\n` +
        `📋 服務類型：${newData.service_type}\n` +
        `📅 日期：${newData.scheduled_date}\n` +
        `⏰ 時段：${newData.time_slot}\n` +
        `🏠 地址：${newData.address}\n` +
        `👤 姓名：${newData.client_name}\n` +
        `📞 電話：${newData.phone}`
      );
      setBookingData(newData);
      setBookingStep('confirm');
    } else {
      // Normal chat
      sendChat(text);
    }
  };

  const getAmount = (serviceType) => {
    if (serviceType === '基礎月護-4次') return 8400;
    if (serviceType === '進階月安-8次') return 16000;
    if (serviceType === '尊寵月怡-12次') return 24600;
    return 2000; // 單次清潔預設
  };

  const confirmBooking = async () => {
    addMessage('user', '確認送出預約');
    setBookingStep(null);
    setLoading(true);
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        addMessage('assistant', '❗ 建立預約需要先登入帳號。請點下方按鈕登入後再完成預約。');
        setLoading(false);
        setBookingStep('login_required');
        return;
      }
      const user = await base44.auth.me();
      const booking = await base44.entities.Booking.create({
        client_id: user.id,
        client_name: bookingData.client_name,
        service_type: bookingData.service_type,
        status: '待確認',
        scheduled_date: bookingData.scheduled_date,
        time_slot: bookingData.time_slot,
        address: bookingData.address,
        notes: `電話: ${bookingData.phone} (由小赫 AI 協助預約)`,
      });
      addMessage('assistant', '🎉 預約已建立！正在跳轉至付款頁面...');
      const amount = getAmount(bookingData.service_type);
      setTimeout(() => {
        window.location.href = `/PaymentRedirect?booking_id=${booking.id}&amount=${amount}&item_name=${encodeURIComponent(bookingData.service_type)}`;
      }, 1200);
    } catch (e) {
      addMessage('assistant', `抱歉，預約建立失敗（${e.message || '未知錯誤'}），請撥打 0906-991-023 由客服協助。`);
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async (text) => {
    if (!text || loading) return;
    const history = messages.filter(m => m.role !== 'system');
    addMessage('user', text);
    setLoading(true);
    try {
      const res = await base44.functions.invoke('hesonAI', {
        message: text,
        history: history.map(m => ({ role: m.role, content: m.content })),
      });
      const reply = res.data?.reply || '抱歉，我暫時無法回答，請撥打 0906-991-023 聯繫客服。';
      addMessage('assistant', reply);
    } catch {
      addMessage('assistant', '抱歉，目前連線異常，請稍後再試或撥打 0906-991-023。');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = () => {
    setBookingStep(null);
    setBookingData({});
    addMessage('assistant', '已取消預約流程，有其他問題歡迎繼續詢問！');
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
            style={{ width: 'min(360px, calc(100vw - 32px))', height: 'min(520px, calc(100vh - 160px))' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20">
                <img src="https://media.base44.com/images/public/6945eea24a533fe8f1a31e80/08fd95ace_generated_image.png" alt="小赫" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">小赫 AI 客服</p>
                <p className="text-amber-100 text-xs">HESON 赫頌 · 24hr 智能回覆</p>
              </div>
              {bookingStep && (
                <button onClick={cancelBooking} className="ml-auto mr-1 text-white/70 hover:text-white flex items-center gap-1 text-xs">
                  <ChevronLeft className="w-3 h-3" /> 取消預約
                </button>
              )}
              <button onClick={() => setOpen(false)} className={`${bookingStep ? '' : 'ml-auto'} text-white/70 hover:text-white`}>
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
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-amber-500 text-white rounded-br-sm'
                      : 'bg-white text-stone-700 shadow-sm rounded-bl-sm border border-stone-100'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {/* Quick suggestion chips - inline in message area, one-time */}
              {messages.length === 1 && !quickShown && !bookingStep && (
                <div className="flex flex-wrap gap-1.5 pl-9 pb-1">
                  {QUICK_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => { setQuickShown(true); handleQuickClick(q); }}
                      className="text-xs bg-white border border-amber-200 text-amber-700 px-2.5 py-1.5 rounded-full hover:bg-amber-50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
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
              {bookingResult && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    預約已建立！
                  </div>
                  <p className="text-xs text-stone-600 mb-3">服務日期：{bookingResult.scheduled_date} {bookingResult.time_slot}</p>
                  <CalendarExportButton booking={bookingResult} />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Interactive Options Area */}
            <div className="flex-shrink-0 border-t border-stone-100 bg-white">
              {/* Service Type Selection */}
              {bookingStep === 'service' && (
                <div className="px-3 py-2 grid grid-cols-2 gap-1.5">
                  {SERVICE_TYPES.map(s => (
                    <button key={s} onClick={() => handleBookingStep(s, s)}
                      className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-2 rounded-xl hover:bg-amber-100 transition-colors font-medium">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* City Selection */}
              {bookingStep === 'city' && (
                <div className="px-3 py-2 max-h-32 overflow-y-auto grid grid-cols-3 gap-1">
                  {TAIWAN_CITIES.map(c => (
                    <button key={c} onClick={() => handleBookingStep(c, c)}
                      className="text-xs bg-stone-50 border border-stone-200 text-stone-700 px-1 py-1.5 rounded-lg hover:bg-amber-50 hover:border-amber-200 transition-colors">
                      {c}
                    </button>
                  ))}
                </div>
              )}

              {/* Date Selection - calendar input */}
              {bookingStep === 'date' && (
                <div className="px-3 py-3 flex flex-col gap-2">
                  <p className="text-xs text-stone-500">請點選日期：</p>
                  <input
                    ref={dateInputRef}
                    type="date"
                    min={getMinDate()}
                    onChange={e => { if (e.target.value) handleBookingStep(e.target.value, e.target.value); }}
                    className="w-full text-sm border border-amber-300 rounded-xl px-3 py-2.5 outline-none focus:border-amber-500 bg-amber-50 cursor-pointer"
                  />
                </div>
              )}

              {/* Time Slot Selection */}
              {bookingStep === 'time' && (
                <div className="px-3 py-2 flex flex-col gap-1.5">
                  {TIME_SLOTS.map(t => (
                    <button key={t} onClick={() => handleBookingStep(t, t)}
                      className="text-xs bg-stone-50 border border-stone-200 text-stone-700 px-3 py-2.5 rounded-xl hover:bg-amber-50 hover:border-amber-200 transition-colors text-left">
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Login Required Step */}
              {bookingStep === 'login_required' && (
                <div className="px-3 py-3 flex flex-col gap-2">
                  <button
                    onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                    className="w-full text-sm bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-medium transition-colors"
                  >
                    🔐 立即登入以完成預約
                  </button>
                  <button onClick={cancelBooking} className="w-full text-xs text-stone-400 hover:text-stone-600">
                    取消
                  </button>
                </div>
              )}

              {/* Confirm Step */}
              {bookingStep === 'confirm' && (
                <div className="px-3 py-2 flex gap-2">
                  <button onClick={confirmBooking}
                    className="flex-1 text-sm bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-medium transition-colors">
                    ✓ 確認並前往付款
                  </button>
                  <button onClick={cancelBooking}
                    className="flex-1 text-sm bg-stone-100 hover:bg-stone-200 text-stone-600 py-2.5 rounded-xl font-medium transition-colors">
                    ✕ 取消
                  </button>
                </div>
              )}

              {/* Text Input: always show for free chat & text-entry steps */}
              {(!bookingStep || bookingStep === 'road' || bookingStep === 'name' || bookingStep === 'phone') && (
                <div className="px-3 py-3 flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleTextInput()}
                    placeholder={
                      bookingStep === 'road' ? '輸入路名與門牌號碼...' :
                      bookingStep === 'name' ? '輸入您的姓名...' :
                      bookingStep === 'phone' ? '輸入聯絡電話...' :
                      '輸入您的問題...'
                    }
                    className="flex-1 text-sm border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-amber-400 transition-colors"
                  />
                  <button
                    onClick={handleTextInput}
                    disabled={!input.trim() || loading}
                    className="w-9 h-9 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}