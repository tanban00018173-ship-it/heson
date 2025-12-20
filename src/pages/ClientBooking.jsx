import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const timeSlots = [
  { value: "上午 08:00-12:00", label: "上午 08:00-12:00" },
  { value: "下午 13:00-17:00", label: "下午 13:00-17:00" },
  { value: "晚間 18:00-21:00", label: "晚間 18:00-21:00" },
];

export default function ClientBooking() {
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [date, setDate] = useState(null);
  const [formData, setFormData] = useState({
    time_slot: '',
    notes: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
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
    
    if (!date || !formData.time_slot) {
      toast.error("請選擇日期與時段");
      return;
    }

    setIsSubmitting(true);

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

    await base44.entities.Booking.create(bookingData);
    
    setIsSubmitting(false);
    setIsSuccess(true);
    toast.success("預約成功！");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-stone-50 flex">
        <div className="hidden lg:block">
          <Sidebar userRole="client" userName={user?.full_name} />
        </div>
        <MobileNav userRole="client" userName={user?.full_name} />
        
        <main className="flex-1 pt-16 lg:pt-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-medium text-stone-800 mb-4">預約成功！</h1>
            <p className="text-stone-600 mb-8">
              我們將盡快安排家事管理師為您服務
            </p>
            <Button 
              onClick={() => setIsSuccess(false)}
              className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-8"
            >
              再次預約
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <div className="hidden lg:block">
        <Sidebar userRole="client" userName={user?.full_name} />
      </div>
      <MobileNav userRole="client" userName={user?.full_name} />
      
      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-stone-800">新增預約</h1>
            <p className="text-stone-500 mt-1">選擇您希望的服務時間</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">預約資訊</CardTitle>
                <CardDescription>
                  當前方案：{profile?.subscription_plan || '尚未訂閱'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Address Display */}
                  {profile?.address && (
                    <div className="bg-stone-50 rounded-xl p-4">
                      <Label className="text-xs text-stone-500">服務地址</Label>
                      <p className="text-stone-800 mt-1">{profile.address}</p>
                    </div>
                  )}

                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label>選擇日期 *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal rounded-xl h-12"
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

                  {/* Time Slot */}
                  <div className="space-y-3">
                    <Label>選擇時段 *</Label>
                    <RadioGroup 
                      value={formData.time_slot}
                      onValueChange={(v) => setFormData({ ...formData, time_slot: v })}
                      className="space-y-3"
                    >
                      {timeSlots.map((slot) => (
                        <Label
                          key={slot.value}
                          htmlFor={slot.value}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.time_slot === slot.value
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <RadioGroupItem value={slot.value} id={slot.value} />
                          <span className="font-medium text-stone-700">{slot.label}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">備註（選填）</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="有任何特殊需求請在此說明..."
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
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}