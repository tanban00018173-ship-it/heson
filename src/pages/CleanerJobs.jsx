import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toast } from "sonner";

export default function CleanerJobs() {
  const [user, setUser] = useState(null);
  const [cleanerProfile, setCleanerProfile] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Load cleaner profile
      const profiles = await base44.entities.CleanerProfile.filter({ user_id: userData.id });
      if (profiles?.[0]) {
        setCleanerProfile(profiles[0]);
      }
    };
    loadUser();
  }, []);

  const { data: bookings } = useQuery({
    queryKey: ['availableBookings'],
    queryFn: () => base44.entities.Booking.filter({ status: '已確認' }, '-scheduled_date'),
    initialData: [],
  });

  // Filter bookings without assigned cleaner
  const availableJobs = bookings?.filter(b => !b.cleaner_id) || [];

  const acceptJobMutation = useMutation({
    mutationFn: async (booking) => {
      return base44.entities.Booking.update(booking.id, {
        cleaner_id: user?.id,
        cleaner_name: cleanerProfile?.nickname || user?.full_name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableBookings'] });
      toast.success("接案成功！");
    },
  });

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
        <Sidebar userRole="cleaner" userName={cleanerProfile?.nickname || user?.full_name} />
      </div>
      <MobileNav userRole="cleaner" userName={cleanerProfile?.nickname || user?.full_name} />
      
      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-stone-800">接案列表</h1>
            <p className="text-stone-500 mt-1">查看並接取可用的服務案件</p>
          </div>

          {/* Jobs List */}
          {availableJobs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">目前沒有可接取的案件</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {availableJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className="bg-blue-100 text-blue-700">
                              {job.service_type}
                            </Badge>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 text-sm text-stone-600">
                              <Calendar className="w-4 h-4 text-stone-400" />
                              {job.scheduled_date && format(new Date(job.scheduled_date), 'PPP', { locale: zhTW })}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-stone-600">
                              <Clock className="w-4 h-4 text-stone-400" />
                              {job.time_slot}
                            </div>
                            {job.address && (
                              <div className="flex items-center gap-2 text-sm text-stone-600 col-span-2">
                                <MapPin className="w-4 h-4 text-stone-400" />
                                {job.address}
                              </div>
                            )}
                            {job.client_name && (
                              <div className="flex items-center gap-2 text-sm text-stone-600">
                                <User className="w-4 h-4 text-stone-400" />
                                客戶：{job.client_name}
                              </div>
                            )}
                          </div>
                          {job.notes && (
                            <p className="text-sm text-stone-500 mt-3 bg-stone-50 p-3 rounded-lg">
                              備註：{job.notes}
                            </p>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => acceptJobMutation.mutate(job)}
                          disabled={acceptJobMutation.isPending}
                          className="bg-amber-500 hover:bg-amber-600 text-white rounded-full"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          接取案件
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}