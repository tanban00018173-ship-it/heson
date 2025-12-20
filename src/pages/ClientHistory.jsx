import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Camera, User, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

export default function ClientHistory() {
  const [user, setUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

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

  const { data: bookings } = useQuery({
    queryKey: ['clientBookings', user?.id],
    queryFn: () => base44.entities.Booking.filter({ client_id: user?.id }, '-scheduled_date'),
    enabled: !!user?.id,
    initialData: [],
  });

  const { data: reports } = useQuery({
    queryKey: ['serviceReports'],
    queryFn: () => base44.entities.ServiceReport.list(),
    initialData: [],
  });

  const getReportForBooking = (bookingId) => {
    return reports?.find(r => r.booking_id === bookingId);
  };

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
            <h1 className="text-2xl font-medium text-stone-800">服務紀錄</h1>
            <p className="text-stone-500 mt-1">查看您的歷史服務與清潔前後對比</p>
          </div>

          {/* Bookings List */}
          {bookings?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">目前沒有服務紀錄</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings?.map((booking, index) => {
                const report = getReportForBooking(booking.id);
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                              <span className="text-sm font-medium text-stone-700">{booking.service_type}</span>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2">
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
                              {booking.cleaner_name && (
                                <div className="flex items-center gap-2 text-sm text-stone-600">
                                  <User className="w-4 h-4 text-stone-400" />
                                  {booking.cleaner_name}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {report && booking.status === '已完成' && (
                            <Button
                              variant="outline"
                              className="rounded-full"
                              onClick={() => setSelectedReport(report)}
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              查看照片
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Photo Comparison Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-600" />
              清潔前後對比
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              {/* Before & After Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Before */}
                <div>
                  <h3 className="text-sm font-medium text-stone-600 mb-3">清潔前</h3>
                  <div className="space-y-3">
                    {selectedReport.before_photos?.length > 0 ? (
                      selectedReport.before_photos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`清潔前 ${idx + 1}`}
                          className="w-full rounded-xl object-cover"
                        />
                      ))
                    ) : (
                      <div className="bg-stone-100 rounded-xl h-48 flex items-center justify-center text-stone-400">
                        暫無照片
                      </div>
                    )}
                  </div>
                </div>
                
                {/* After */}
                <div>
                  <h3 className="text-sm font-medium text-stone-600 mb-3">清潔後</h3>
                  <div className="space-y-3">
                    {selectedReport.after_photos?.length > 0 ? (
                      selectedReport.after_photos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`清潔後 ${idx + 1}`}
                          className="w-full rounded-xl object-cover"
                        />
                      ))
                    ) : (
                      <div className="bg-stone-100 rounded-xl h-48 flex items-center justify-center text-stone-400">
                        暫無照片
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cleaner Notes */}
              {selectedReport.cleaner_notes && (
                <div className="bg-stone-50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-stone-600 mb-2">管理師留言</h3>
                  <p className="text-stone-700">{selectedReport.cleaner_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}