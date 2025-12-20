import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Plus, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

export default function ClientDashboard() {
  const [user, setUser] = useState(null);

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
    queryKey: ['clientProfile', user?.email],
    queryFn: () => base44.entities.ClientProfile.filter({ user_id: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  const { data: bookings } = useQuery({
    queryKey: ['clientBookings', user?.id],
    queryFn: () => base44.entities.Booking.filter({ client_id: user?.id }, '-scheduled_date'),
    enabled: !!user?.id,
    initialData: [],
  });

  const profile = clientProfile?.[0];
  const upcomingBookings = bookings?.filter(b => 
    b.status !== '已完成' && b.status !== '已取消'
  ).slice(0, 3) || [];

  const getStatusColor = (status) => {
    switch (status) {
      case '待確認': return 'bg-yellow-100 text-yellow-700';
      case '已確認': return 'bg-blue-100 text-blue-700';
      case '已完成': return 'bg-green-100 text-green-700';
      case '已取消': return 'bg-stone-100 text-stone-500';
      default: return 'bg-stone-100 text-stone-600';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
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
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-stone-800">
              您好，{user?.full_name || '貴賓'}
            </h1>
            <p className="text-stone-500 mt-1">歡迎回到您的客戶專區</p>
          </div>

          {/* Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="mb-8 bg-gradient-to-br from-stone-800 to-stone-900 text-white overflow-hidden">
              <CardContent className="p-8 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="text-amber-400 text-sm font-medium">我的方案</span>
                  </div>
                  <h2 className="text-3xl font-medium mb-2">
                    {profile?.subscription_plan || '尚未訂閱'}
                  </h2>
                  {profile?.remaining_visits !== undefined && (
                    <p className="text-stone-400">
                      剩餘服務次數：<span className="text-white font-medium">{profile.remaining_visits} 次</span>
                    </p>
                  )}
                  <div className="mt-6">
                    <Link to={createPageUrl("ClientBooking")}>
                      <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full">
                        <Plus className="w-4 h-4 mr-2" />
                        預約服務
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-stone-800">即將到來的預約</h2>
              <Link to={createPageUrl("ClientHistory")} className="text-sm text-amber-600 hover:text-amber-700">
                查看全部
              </Link>
            </div>

            {upcomingBookings.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-500 mb-4">目前沒有預約的服務</p>
                  <Link to={createPageUrl("ClientBooking")}>
                    <Button variant="outline" className="rounded-full">
                      立即預約
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                              <span className="text-sm text-stone-500">{booking.service_type}</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-stone-600">
                                <Calendar className="w-4 h-4 text-stone-400" />
                                {booking.scheduled_date && format(new Date(booking.scheduled_date), 'PPP', { locale: zhTW })}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-stone-600">
                                <Clock className="w-4 h-4 text-stone-400" />
                                {booking.time_slot}
                              </div>
                              {booking.address && (
                                <div className="flex items-center gap-2 text-sm text-stone-600">
                                  <MapPin className="w-4 h-4 text-stone-400" />
                                  {booking.address}
                                </div>
                              )}
                            </div>
                          </div>
                          {booking.cleaner_name && (
                            <div className="text-right">
                              <p className="text-xs text-stone-400">家事管理師</p>
                              <p className="text-sm font-medium text-stone-700">{booking.cleaner_name}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-8 grid md:grid-cols-2 gap-4"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <Link to={createPageUrl("ClientHistory")}>
                <CardContent className="p-6">
                  <h3 className="font-medium text-stone-800 group-hover:text-amber-600 transition-colors">
                    服務紀錄
                  </h3>
                  <p className="text-sm text-stone-500 mt-1">
                    查看歷史服務紀錄與清潔前後對比照片
                  </p>
                </CardContent>
              </Link>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <Link to={createPageUrl("ClientProfile")}>
                <CardContent className="p-6">
                  <h3 className="font-medium text-stone-800 group-hover:text-amber-600 transition-colors">
                    個人資料
                  </h3>
                  <p className="text-sm text-stone-500 mt-1">
                    更新您的聯絡資訊與居家資料
                  </p>
                </CardContent>
              </Link>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}