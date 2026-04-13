import React, { useState, useEffect } from 'react';
import CalendarExportButton from '@/components/CalendarExportButton';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon, Check, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const serviceTypes = [
  { value: "單次清潔", label: "單次清潔", price: "依坪數報價", description: "首次試掃或單次服務" },
  { value: "基礎月護-4次", label: "基礎月護", price: "NT$ 8,400/月", description: "每週一次，4次/月" },
  { value: "進階月安-8次", label: "進階月安", price: "NT$ 16,000/月", description: "每週兩次，8次/月" },
  { value: "尊榮月恆-12次", label: "尊榮月恆", price: "NT$ 24,600/月", description: "每週三次，12次/月" },
];

const timeSlots = [
  { value: "上午 08:00-12:00", label: "上午 08:00-12:00" },
  { value: "下午 13:00-17:00", label: "下午 13:00-17:00" },
  { value: "晚間 18:00-21:00", label: "晚間 18:00-21:00" },
];

export default function BookingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [date, setDate] = useState(null);
  const { data: cleaners = [] } = useQuery({
    queryKey: ['activeCleaners'],
    queryFn: () => base44.entities.CleanerProfile.filter({ is_active: true }),
  });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    housing_type: '',
    square_footage: '',
    service_type: '單次清潔',
    time_slot: '',
    preferred_cleaner: '',
    notes: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          name: userData.full_name || '',
        }));
      }
    };
    checkAuth();
  }, []);

  const getPriceEstimate = () => {
    const sqft = parseFloat(formData.square_footage) || 0;
    switch (formData.service_type) {
      case '單次清潔':
        if (!sqft) return null;
        return { label: '單次預估費用', price: `NT$ ${Math.max(2000, Math.round(sqft * 150)).toLocaleString()}`, note: '（依實際坪數與服務內容調整）' };
      case '基礎月護-4次':
        return { label: '月費', price: 'NT$ 8,400', note: '/ 月・4次服務' };
      case '進階月安-8次':
        return { label: '月費', price: 'NT$ 16,000', note: '/ 月・8次服務' };
      case '尊榮月恆-12次':
        return { label: '月費', price: 'NT$ 24,600', note: '/ 月・12次服務' };
      default: return null;
    }
  };

  const priceEstimate = getPriceEstimate();

  const getAmount = () => {
    const sqft = parseFloat(formData.square_footage) || 30;
    switch (formData.service_type) {
      case '單次清潔': return Math.max(2000, Math.round(sqft * 150));
      case '基礎月護-4次': return 8400;
      case '進階月安-8次': return 16000;
      case '尊榮月恆-12次': return 24600;
      default: return 2000;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.address || !date || !formData.time_slot) {
      toast.error('請填寫所有必填欄位');
      return;
    }

    setIsSubmitting(true);

    const bookingData = {
      client_id: user?.id || 'guest',
      client_name: formData.name,
      service_type: formData.service_type,
      status: '待確認',
      scheduled_date: format(date, 'yyyy-MM-dd'),
      time_slot: formData.time_slot,
      address: formData.address,
      notes: `房型: ${formData.housing_type || '未填'}, 坪數: ${formData.square_footage || '未填'}, 指定清潔師: ${formData.preferred_cleaner || '不指定'}, 備註: ${formData.notes || '無'}`,
    };

    const booking = await base44.entities.Booking.create(bookingData);
    
    // 發送通知給管理員
    await base44.integrations.Core.SendEmail({
      to: "larry87tw@gmail.com",
      subject: `新預約通知 - ${formData.name}`,
      body: `新的預約已建立：\n\n客戶姓名：${formData.name}\n聯絡電話：${formData.phone}\n服務地址：${formData.address}\n服務類型：${formData.service_type}\n預約日期：${format(date, 'yyyy-MM-dd')}\n時段：${formData.time_slot}\n房屋類型：${formData.housing_type || '未填'}\n坪數：${formData.square_footage || '未填'}\n備註：${formData.notes || '無'}`
    });

    setIsSubmitting(false);
    // 導向付款
    const amount = getAmount();
    const itemName = formData.service_type;
    window.location.href = `/PaymentRedirect?booking_id=${booking.id}&amount=${amount}&item_name=${encodeURIComponent(itemName)}`;
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <section className="pt-32 pb-20 min-h-[80vh] flex items-center bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
          <div className="container mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-medium text-stone-800 mb-4">
                預約成功！
              </h1>
              <p className="text-stone-600 mb-4">
                感謝您的預約，我們的客服人員將於 24 小時內與您聯繫確認服務細節。
              </p>
              <div className="flex justify-center mb-6">
                <CalendarExportButton booking={{
                  scheduled_date: date ? format(date, 'yyyy-MM-dd') : '',
                  time_slot: formData.time_slot,
                  service_type: formData.service_type,
                  address: formData.address,
                }} />
              </div>
              <Button 
                onClick={() => setIsSuccess(false)}
                className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-8"
              >
                再次預約
              </Button>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-32 pb-8 bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-stone-600 font-medium">首次預約享免費試掃</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-stone-800">
              立即<span className="font-medium">預約服務</span>
            </h1>
            <p className="text-stone-600 mt-4">
              填寫以下資料，讓我們為您安排最適合的服務
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 bg-gradient-to-b from-stone-50 to-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="max-w-2xl mx-auto shadow-xl border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-stone-800">預約資訊</CardTitle>
                <CardDescription>請填寫您的聯絡資訊與服務需求</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Contact Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">姓名 *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="請輸入您的姓名"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">聯絡電話 *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0912-345-678"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">服務地址 *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="請輸入完整地址"
                      className="rounded-xl"
                    />
                  </div>

                  {/* Housing Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>房屋類型</Label>
                      <Select 
                        value={formData.housing_type} 
                        onValueChange={(v) => setFormData({ ...formData, housing_type: v })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="請選擇" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="透天">透天</SelectItem>
                          <SelectItem value="公寓">公寓</SelectItem>
                          <SelectItem value="華廈、大樓">華廈、大樓</SelectItem>
                          <SelectItem value="農舍">農舍</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sqft">坪數</Label>
                      <Input
                        id="sqft"
                        type="number"
                        value={formData.square_footage}
                        onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
                        placeholder="例：30"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Service Type */}
                  <div className="space-y-3">
                    <Label>服務方案 *</Label>
                    <RadioGroup 
                      value={formData.service_type}
                      onValueChange={(v) => setFormData({ ...formData, service_type: v })}
                      className="grid md:grid-cols-2 gap-3"
                    >
                      {serviceTypes.map((service) => (
                        <Label
                          key={service.value}
                          htmlFor={service.value}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.service_type === service.value
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <RadioGroupItem value={service.value} id={service.value} className="mt-1" />
                          <div>
                            <p className="font-medium text-stone-800">{service.label}</p>
                            <p className="text-xs text-stone-500">{service.description}</p>
                            <p className="text-sm text-amber-600 font-medium mt-1">{service.price}</p>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Price Estimate */}
                  {priceEstimate && (
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                      <div>
                        <p className="text-xs text-amber-600 font-medium">{priceEstimate.label}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{priceEstimate.note}</p>
                      </div>
                      <p className="text-2xl font-semibold text-amber-700">{priceEstimate.price}</p>
                    </div>
                  )}

                  {/* Date & Time */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>希望服務日期 *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal rounded-xl"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: zhTW }) : "選擇日期"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>希望時段 *</Label>
                      <Select 
                        value={formData.time_slot} 
                        onValueChange={(v) => setFormData({ ...formData, time_slot: v })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="請選擇時段" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Preferred Cleaner */}
                  <div className="space-y-2">
                    <Label>是否有想指定的清潔師？</Label>
                    <Select
                      value={formData.preferred_cleaner}
                      onValueChange={(v) => setFormData({ ...formData, preferred_cleaner: v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="不指定（由我們安排最適合的張伴為您服務）" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="不指定">不指定（由我們安排）</SelectItem>
                        {cleaners.map(c => (
                          <SelectItem key={c.id} value={c.nickname}>{c.nickname}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {cleaners.length > 0 && (
                      <p className="text-xs text-stone-400">
                        想先了解我們的團隊？可參考 <a href="/CleanerTeam" className="text-amber-600 underline" target="_blank">清潔師團隊頁面</a>
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">備註</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="有寵物、特殊需求等請在此說明..."
                      className="rounded-xl min-h-[100px]"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-stone-800 hover:bg-stone-900 text-white py-6 rounded-xl text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        處理中...
                      </>
                    ) : (
                      "確認預約"
                    )}
                  </Button>

                  <p className="text-xs text-stone-400 text-center">
                    送出後，我們將於 24 小時內與您聯繫確認
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}