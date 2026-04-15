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

const serviceCategories = [
  {
    id: "home_cleaning",
    label: "居家清潔",
    emoji: "🏠",
    description: "讓我們了解您的居家清潔需求",
    serviceTypes: [
      { value: "單次清潔", label: "單次清潔", price: "依坪數報價" },
      { value: "基礎月護-4次", label: "基礎月護", price: "NT$ 8,400/月" },
      { value: "進階月安-8次", label: "進階月安", price: "NT$ 16,000/月" },
      { value: "尊榮月恆-12次", label: "尊榮月恆", price: "NT$ 24,600/月" },
    ],
    basePrice: 2000,
    extraFields: ["housing_type", "sqft", "clean_type"],
  },
  {
    id: "appliance_cleaning",
    label: "家電清洗",
    emoji: "❄️",
    description: "請告訴我們需要清洗的家電種類與數量",
    serviceTypes: [{ value: "單次清潔", label: "家電清洗", price: "NT$ 1,200起" }],
    basePrice: 1200,
    extraFields: ["appliances"],
  },
  {
    id: "organization",
    label: "整理收納",
    emoji: "📦",
    description: "讓整理師幫您打造最舒適的生活空間",
    serviceTypes: [{ value: "單次清潔", label: "整理收納", price: "NT$ 1,800起" }],
    basePrice: 1800,
    extraFields: ["sqft", "space_desc"],
  },
  {
    id: "commercial",
    label: "商業清潔",
    emoji: "🏢",
    description: "專業企業清潔，維持最佳工作環境",
    serviceTypes: [{ value: "單次清潔", label: "商業清潔", price: "NT$ 2,400起" }],
    basePrice: 2400,
    extraFields: ["company", "sqft", "clean_freq"],
  },
  {
    id: "fabric_cleaning",
    label: "布面清洗",
    emoji: "🛋️",
    description: "深層清潔沙發、床墊、窗簾等布面家具",
    serviceTypes: [{ value: "單次清潔", label: "布面清洗", price: "NT$ 1,500起" }],
    basePrice: 1500,
    extraFields: ["fabric_items"],
  },
  {
    id: "post_reno",
    label: "裝潢後清潔",
    emoji: "🔨",
    description: "新屋、工程後的專業深度清潔",
    serviceTypes: [{ value: "單次清潔", label: "裝潢後清潔", price: "NT$ 3,000起" }],
    basePrice: 3000,
    extraFields: ["sqft", "finish_date"],
  },
];

const timeSlots = [
  { value: "上午 08:00-12:00", label: "上午 08:00-12:00" },
  { value: "下午 13:00-17:00", label: "下午 13:00-17:00" },
  { value: "晚間 18:00-21:00", label: "晚間 18:00-21:00" },
];

const applianceOptions = ["冷氣", "洗衣機", "油煙機", "熱水器", "冰箱", "烘衣機"];
const fabricOptions = ["沙發", "床墊(單人)", "床墊(雙人)", "窗簾(組)", "椅子"];

export default function BookingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [date, setDate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(serviceCategories[0]);
  const [appliances, setAppliances] = useState({});
  const [fabricItems, setFabricItems] = useState({});
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
    company: '',
    space_desc: '',
    clean_type: '',
    clean_freq: '',
    finish_date: '',
  });

  useEffect(() => {
    const loadUserData = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // 從 ClientProfile 取得已填的資料
        try {
          const profiles = await base44.entities.ClientProfile.filter({ user_id: userData.id });
          const profile = profiles[0];
          
          if (profile) {
            setFormData(prev => ({
              ...prev,
              name: userData.full_name || '',
              phone: profile.phone || '',
              address: profile.address || '',
              housing_type: profile.housing_type || '',
              square_footage: profile.square_footage?.toString() || '',
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              name: userData.full_name || '',
            }));
          }
        } catch (err) {
          console.warn('Failed to load client profile:', err);
          setFormData(prev => ({
            ...prev,
            name: userData.full_name || '',
          }));
        }
      }
    };
    loadUserData();
  }, []);

  const getAmount = () => {
    if (selectedCategory.id === 'home_cleaning') {
      const sqft = parseFloat(formData.square_footage) || 30;
      switch (formData.service_type) {
        case '單次清潔': return Math.max(2000, Math.round(sqft * 150));
        case '基礎月護-4次': return 8400;
        case '進階月安-8次': return 16000;
        case '尊榮月恆-12次': return 24600;
        default: return 2000;
      }
    }
    return selectedCategory.basePrice;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 驗證必填欄位
    const missingFields = [];
    if (!formData.name) missingFields.push('姓名');
    if (!formData.phone) missingFields.push('聯絡電話');
    if (!formData.address) missingFields.push('服務地址');
    if (!date) missingFields.push('希望服務日期');
    if (!formData.time_slot) missingFields.push('希望時段');
    
    if (missingFields.length > 0) {
      toast.error(`請填寫必填欄位: ${missingFields.join('、')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      let notesArr = [`【${selectedCategory.label}】`];
      if (formData.housing_type) notesArr.push(`房型: ${formData.housing_type}`);
      if (formData.square_footage) notesArr.push(`坪數: ${formData.square_footage}`);
      if (formData.clean_type) notesArr.push(`清潔類型: ${formData.clean_type}`);
      if (formData.company) notesArr.push(`公司: ${formData.company}`);
      if (formData.space_desc) notesArr.push(`空間描述: ${formData.space_desc}`);
      if (formData.clean_freq) notesArr.push(`清潔頻率: ${formData.clean_freq}`);
      if (formData.finish_date) notesArr.push(`完工日期: ${formData.finish_date}`);
      const appList = Object.entries(appliances).filter(([,v])=>v>0).map(([k,v])=>`${k}×${v}`).join(', ');
      if (appList) notesArr.push(`家電: ${appList}`);
      const fabList = Object.entries(fabricItems).filter(([,v])=>v>0).map(([k,v])=>`${k}×${v}`).join(', ');
      if (fabList) notesArr.push(`布面: ${fabList}`);
      if (formData.preferred_cleaner) notesArr.push(`指定清潔師: ${formData.preferred_cleaner}`);
      if (formData.notes) notesArr.push(`備註: ${formData.notes}`);

      const bookingData = {
        client_id: user?.id || 'guest',
        client_name: formData.name,
        service_type: formData.service_type,
        status: '待確認',
        scheduled_date: format(date, 'yyyy-MM-dd'),
        time_slot: formData.time_slot,
        address: formData.address,
        notes: notesArr.join(' | '),
      };

      const booking = await base44.entities.Booking.create(bookingData);
      
      // 同步到Google Sheet
      try {
        await base44.functions.invoke('syncBookingToSheet', {
          bookingId: booking.id,
          bookingData: {
            ...bookingData,
            phone: formData.phone,
            email: user?.email || '',
            service_area: formData.housing_type || selectedCategory.label,
            housing_type: formData.housing_type,
            square_footage: formData.square_footage,
            has_pets: formData.notes?.includes('寵物'),
          }
        });
      } catch (syncErr) {
        console.warn('Sheet sync failed:', syncErr);
      }
      
      // 發送通知給管理員
      await base44.integrations.Core.SendEmail({
        to: "larry87tw@gmail.com",
        subject: `新預約通知 - ${formData.name}`,
        body: `新的預約已建立：\n\n客戶姓名：${formData.name}\n聯絡電話：${formData.phone}\n服務地址：${formData.address}\n服務類型：${selectedCategory.label}\n預約日期：${format(date, 'yyyy-MM-dd')}\n時段：${formData.time_slot}\n\n${notesArr.slice(1).join('\n')}`
      });

      setIsSubmitting(false);
      window.location.href = `/PaymentRedirect?booking_id=${booking.id}&amount=${getAmount()}&item_name=${encodeURIComponent(`HESON ${selectedCategory.label}`)}`;
    } catch (error) {
      setIsSubmitting(false);
      toast.error('預約建立失敗，請稍後重試');
    }
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
                  service_type: selectedCategory.label,
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

      {/* Service Category Selection */}
      <section className="py-12 bg-gradient-to-b from-stone-50 to-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="max-w-4xl mx-auto shadow-xl border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-stone-800">選擇服務類型</CardTitle>
                <CardDescription>請選擇您需要的清潔服務</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {serviceCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-4 rounded-xl text-center transition-all ${
                        selectedCategory.id === cat.id
                          ? 'bg-amber-100 border-2 border-amber-500'
                          : 'bg-stone-50 border-2 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{cat.emoji}</div>
                      <p className="font-medium text-sm text-stone-800">{cat.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 bg-white pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="max-w-2xl mx-auto shadow-xl border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-stone-800 flex items-center gap-2">
                  <span>{selectedCategory.emoji}</span>
                  {selectedCategory.label}
                </CardTitle>
                <CardDescription>{selectedCategory.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Contact Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="name">姓名 * {user && <span className="text-xs text-stone-400">(已帶入會員資料)</span>}</Label>
                       <Input
                         id="name"
                         value={formData.name}
                         onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                         placeholder="請輸入您的姓名"
                         className="rounded-xl"
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="phone">聯絡電話 * {user && <span className="text-xs text-stone-400">(已帶入會員資料)</span>}</Label>
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
                    <Label htmlFor="address">服務地址 * {user && <span className="text-xs text-stone-400">(已帶入會員資料)</span>}</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="請輸入完整地址"
                      className="rounded-xl"
                    />
                  </div>

                  {/* Dynamic Fields */}
                  {selectedCategory.extraFields.includes('company') && (
                    <div className="space-y-2">
                      <Label>公司名稱</Label>
                      <Input value={formData.company} onChange={(e)=>setFormData({...formData,company:e.target.value})} placeholder="公司名稱" className="rounded-xl" />
                    </div>
                  )}

                  {selectedCategory.extraFields.includes('housing_type') && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>房屋類型</Label>
                        <Select value={formData.housing_type} onValueChange={(v)=>setFormData({...formData,housing_type:v})}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="透天">透天</SelectItem>
                            <SelectItem value="公寓">公寓</SelectItem>
                            <SelectItem value="華廈、大樓">華廈、大樓</SelectItem>
                            <SelectItem value="農舍">農舍</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>坪數</Label>
                        <Input type="number" value={formData.square_footage} onChange={(e)=>setFormData({...formData,square_footage:e.target.value})} placeholder="例：30" className="rounded-xl" />
                      </div>
                    </div>
                  )}

                  {selectedCategory.extraFields.includes('sqft') && !selectedCategory.extraFields.includes('housing_type') && (
                    <div className="space-y-2">
                      <Label>空間坪數</Label>
                      <Input type="number" value={formData.square_footage} onChange={(e)=>setFormData({...formData,square_footage:e.target.value})} placeholder="例：30" className="rounded-xl" />
                    </div>
                  )}

                  {selectedCategory.extraFields.includes('clean_type') && (
                    <div className="space-y-2">
                      <Label>清潔類型</Label>
                      <Select value={formData.clean_type} onValueChange={(v)=>setFormData({...formData,clean_type:v})}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="單次">單次清潔</SelectItem>
                          <SelectItem value="定期">定期清潔（週一次）</SelectItem>
                          <SelectItem value="大掃除">年度大掃除</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedCategory.extraFields.includes('clean_freq') && (
                    <div className="space-y-2">
                      <Label>清潔頻率</Label>
                      <Select value={formData.clean_freq} onValueChange={(v)=>setFormData({...formData,clean_freq:v})}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="每週一次">每週一次</SelectItem>
                          <SelectItem value="每兩週一次">每兩週一次</SelectItem>
                          <SelectItem value="每月一次">每月一次</SelectItem>
                          <SelectItem value="單次">單次</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedCategory.extraFields.includes('finish_date') && (
                    <div className="space-y-2">
                      <Label>裝潢完工日期（預計）</Label>
                      <Input type="date" value={formData.finish_date} onChange={(e)=>setFormData({...formData,finish_date:e.target.value})} className="rounded-xl" />
                    </div>
                  )}

                  {selectedCategory.extraFields.includes('space_desc') && (
                    <div className="space-y-2">
                      <Label>空間描述</Label>
                      <Textarea value={formData.space_desc} onChange={(e)=>setFormData({...formData,space_desc:e.target.value})} placeholder="例：客廳雜物過多，需要分類收納..." className="rounded-xl" />
                    </div>
                  )}

                  {selectedCategory.extraFields.includes('appliances') && (
                    <div className="space-y-2">
                      <Label>需要清洗的家電（請填寫台數）</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {applianceOptions.map(item => (
                          <div key={item} className="flex items-center gap-2 bg-stone-50 rounded-xl p-3">
                            <span className="text-sm text-stone-700 flex-1">{item}</span>
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={appliances[item] || 0}
                              onChange={(e)=>setAppliances({...appliances,[item]:parseInt(e.target.value)||0})}
                              className="w-16 rounded-lg text-center"
                            />
                            <span className="text-xs text-stone-400">台</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCategory.extraFields.includes('fabric_items') && (
                    <div className="space-y-2">
                      <Label>需要清洗的布面項目（請填寫件數）</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {fabricOptions.map(item => (
                          <div key={item} className="flex items-center gap-2 bg-stone-50 rounded-xl p-3">
                            <span className="text-sm text-stone-700 flex-1">{item}</span>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              value={fabricItems[item] || 0}
                              onChange={(e)=>setFabricItems({...fabricItems,[item]:parseInt(e.target.value)||0})}
                              className="w-16 rounded-lg text-center"
                            />
                            <span className="text-xs text-stone-400">件</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Type - only for home_cleaning */}
                  {selectedCategory.id === 'home_cleaning' && (
                    <div className="space-y-3">
                      <Label>服務方案 *</Label>
                      <RadioGroup 
                        value={formData.service_type}
                        onValueChange={(v) => setFormData({ ...formData, service_type: v })}
                        className="grid md:grid-cols-2 gap-3"
                      >
                        {selectedCategory.serviceTypes.map((service) => (
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
                              <p className="text-sm text-amber-600 font-medium mt-1">{service.price}</p>
                            </div>
                          </Label>
                        ))}
                      </RadioGroup>
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
                        <SelectValue placeholder="不指定（由我們安排最適合的清潔師）" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>不指定（由我們安排）</SelectItem>
                        {cleaners.map(c => (
                          <SelectItem key={c.id} value={c.nickname}>{c.nickname}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      "確認預約並前往付款"
                    )}
                  </Button>

                  <p className="text-xs text-stone-400 text-center">
                    送出後將引導您完成付款，付款成功即確認預約
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