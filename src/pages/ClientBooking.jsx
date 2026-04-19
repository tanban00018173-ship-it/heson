import React, { useState, useEffect } from 'react';
import { GAS_BOOKING_WEBHOOK } from '@/lib/webhooks';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon, Check, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'service@heson.tw';

const REGION_PATTERNS = [
  '台北', '新北', '桃園', '新竹', '苗栗', '台中', '彰化', '南投',
  '雲林', '嘉義', '台南', '高雄', '屏東', '宜蘭', '花蓮', '台東', '基隆', '澎湖', '金門'
];

function inferRegion(address) {
  if (!address) return '';
  for (const region of REGION_PATTERNS) {
    if (address.includes(region)) return region;
  }
  return '';
}
const timeSlots = [
  { value: "上午 08:00-12:00", label: "上午", sub: "08:00 – 12:00" },
  { value: "下午 13:00-17:00", label: "下午", sub: "13:00 – 17:00" },
  { value: "晚間 18:00-21:00", label: "晚間", sub: "18:00 – 21:00" },
];

export default function ClientBooking() {
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [date, setDate] = useState(null);
  const [formData, setFormData] = useState({ time_slot: '', notes: '' });

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: clientProfile } = useQuery({
    queryKey: ['clientProfile', user?.id],
    queryFn: () => base44.entities.ClientProfile.filter({ user_id: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  const profile = clientProfile?.[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !formData.time_slot) { toast.error("請選擇日期與時段"); return; }
    setIsSubmitting(true);

    try {
      const bookingData = {
        client_id: user?.id,
        client_name: user?.full_name,
        service_type: profile?.subscription_plan || '單次清潔',
        status: '待確認',
        scheduled_date: format(date, 'yyyy-MM-dd'),
        time_slot: formData.time_slot,
        address: profile?.address || '',
        notes: formData.notes,
      };

      const booking = await base44.entities.Booking.create(bookingData);

      // 送出到 Google Apps Script webhook（寫入 Google Sheet + LINE 通知）
      try {
        await fetch(GAS_BOOKING_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            "_secret": "heson-secret-2026",
            "內部編號": booking.id,
            "姓名": user?.full_name || '',
            "聯絡電話": profile?.phone || '',
            "電子郵件": user?.email || '',
            "需要服務地址": profile?.address || '',
            "服務地區": inferRegion(profile?.address),
            "空間型態": profile?.housing_type || '',
            "需求清潔坪數": profile?.square_footage?.toString() || '',
            "是否有寵物": profile?.has_pets ? '有' : '沒有',
            "想要的時長": profile?.subscription_plan || bookingData.service_type || '',
            "您想申請的服務類型": profile?.subscription_plan || '單次清潔',
            "特殊需求": formData.notes || '',
            "預計開始日期": format(date, 'yyyy-MM-dd'),
            "偏好時段": formData.time_slot || '',
            "偏好的星期": '',
            "同意條款": "是",
            "得知來源": ''
          })
        });
      } catch (webhookErr) {
        console.warn('Webhook 呼叫失敗，不影響預約:', webhookErr);
      }

      // 發送通知（失敗不影響預約）
      try {
        await base44.integrations.Core.SendEmail({
          to: ADMIN_EMAIL,
          subject: `新預約通知 - ${user?.full_name}`,
          body: `新的預約已建立：\n\n客戶姓名：${user?.full_name}\n預約日期：${format(date, 'yyyy-MM-dd')}\n時段：${formData.time_slot}\n服務地址：${profile?.address || ''}\n服務類型：${profile?.subscription_plan || '單次清潔'}\n備註：${formData.notes || '無'}`,
        });
      } catch (emailErr) {
        console.warn('Email 通知失敗，不影響預約:', emailErr);
      }

      setIsSuccess(true);
      toast.success("預約成功！");
    } catch (err) {
      toast.error('預約建立失敗，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f9ff]">
        <div className="animate-spin w-8 h-8 border-2 border-[#131b2e] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f6f9ff] flex font-body">
        <div className="hidden lg:block"><Sidebar userRole="client" userName={user?.full_name} /></div>
        <MobileNav userRole="client" userName={user?.full_name} />
        <main className="flex-1 pt-16 lg:pt-0 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-8">
            <div className="w-20 h-20 bg-[#131b2e] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-headline font-bold text-stone-900 mb-3">預約成功！</h1>
            <p className="text-stone-500 mb-8">我們將盡快安排家事管理師為您服務</p>
            <button onClick={() => setIsSuccess(false)} className="bg-stone-900 text-white font-headline font-bold px-8 py-3 rounded-full hover:opacity-90 transition-opacity">
              再次預約
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f9ff] flex font-body">
      <div className="hidden lg:block"><Sidebar userRole="client" userName={user?.full_name} /></div>
      <MobileNav userRole="client" userName={user?.full_name} />

      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 font-headline mb-1">預約服務</p>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-stone-900">新增預約</h1>
            <p className="text-stone-500 mt-1">選擇您希望的服務時間</p>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Left: Date + Time + Notes */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-7 space-y-5">

              {/* Service Info */}
              {profile?.subscription_plan && (
                <div className="bg-white rounded-3xl p-6 border border-[#e8eef6]">
                  <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-2">當前方案</p>
                  <p className="font-headline font-bold text-stone-900 text-xl">{profile.subscription_plan}</p>
                  {profile.address && (
                    <p className="flex items-center gap-1.5 text-stone-500 text-sm mt-2">
                      <MapPin className="w-4 h-4" />{profile.address}
                    </p>
                  )}
                </div>
              )}

              {/* Date */}
              <div className="bg-white rounded-3xl p-6 border border-[#e8eef6]">
                <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-4">選擇日期</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center gap-3 bg-[#eef4fc] rounded-2xl px-5 py-4 text-left hover:bg-[#e3e9f1] transition-colors">
                      <CalendarIcon className="w-5 h-5 text-stone-500" />
                      <span className={`font-medium ${date ? 'text-stone-900' : 'text-stone-400'}`}>
                        {date ? format(date, "PPP", { locale: zhTW }) : "請選擇日期"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Slots */}
              <div className="bg-white rounded-3xl p-6 border border-[#e8eef6]">
                <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-4">選擇時段</p>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, time_slot: slot.value })}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        formData.time_slot === slot.value
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-[#e8eef6] bg-[#eef4fc] text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <p className="font-headline font-bold text-sm">{slot.label}</p>
                      <p className={`text-xs mt-0.5 ${formData.time_slot === slot.value ? 'text-stone-300' : 'text-stone-400'}`}>{slot.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-3xl p-6 border border-[#e8eef6]">
                <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-3">備註（選填）</p>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="有任何特殊需求請在此說明..."
                  className="rounded-2xl border-[#e8eef6] bg-[#eef4fc] min-h-[100px] resize-none focus:bg-white"
                />
              </div>
            </motion.div>

            {/* Right: Confirm Panel */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-5 sticky top-8">
              <div className="bg-[#131b2e] rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-3xl" />
                <h3 className="text-white font-headline font-bold text-2xl mb-6">確認預約</h3>
                <div className="space-y-4 mb-8">
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-[#7c839b] font-bold uppercase tracking-widest mb-1">服務類型</p>
                    <p className="text-white font-medium">{profile?.subscription_plan || '單次清潔'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] text-[#7c839b] font-bold uppercase tracking-widest mb-1">日期</p>
                      <p className="text-white font-medium text-sm">{date ? format(date, 'M月d日') : '未選擇'}</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] text-[#7c839b] font-bold uppercase tracking-widest mb-1">時段</p>
                      <p className="text-white font-medium text-sm">{formData.time_slot ? formData.time_slot.split(' ')[0] : '未選擇'}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !date || !formData.time_slot}
                  className="w-full bg-white text-[#131b2e] font-headline font-bold py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />處理中...</> : '確認預約'}
                </button>
                <p className="text-center text-[11px] text-[#7c839b] mt-4">確認後將於 24 小時內與您聯繫</p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}