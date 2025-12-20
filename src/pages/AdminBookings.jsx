import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, MapPin, User, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function AdminBookings() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const userData = await base44.auth.me();
      if (userData.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: bookings } = useQuery({
    queryKey: ['allBookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
    initialData: [],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Booking.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
      toast.success("狀態已更新");
    },
  });

  const filteredBookings = statusFilter === 'all' 
    ? bookings 
    : bookings?.filter(b => b.status === statusFilter);

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
        <Sidebar userRole="admin" userName={user?.full_name} />
      </div>
      <MobileNav userRole="admin" userName={user?.full_name} />
      
      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-medium text-stone-800">預約管理</h1>
              <p className="text-stone-500 mt-1">管理所有預約與服務狀態</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="待確認">待確認</SelectItem>
                  <SelectItem value="已確認">已確認</SelectItem>
                  <SelectItem value="已完成">已完成</SelectItem>
                  <SelectItem value="已取消">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bookings Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50">
                        <TableHead>客戶</TableHead>
                        <TableHead>日期 / 時段</TableHead>
                        <TableHead>服務類型</TableHead>
                        <TableHead>管理師</TableHead>
                        <TableHead>狀態</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-stone-400">
                            暫無預約資料
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBookings?.map((booking) => (
                          <TableRow key={booking.id} className="hover:bg-stone-50">
                            <TableCell>
                              <div>
                                <p className="font-medium text-stone-800">{booking.client_name || '未知'}</p>
                                <p className="text-xs text-stone-400 truncate max-w-[150px]">{booking.address}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-stone-400" />
                                <div>
                                  <p className="text-sm">
                                    {booking.scheduled_date && format(new Date(booking.scheduled_date), 'M/d (EEE)', { locale: zhTW })}
                                  </p>
                                  <p className="text-xs text-stone-400">{booking.time_slot}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{booking.service_type}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{booking.cleaner_name || '-'}</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={booking.status}
                                onValueChange={(status) => updateStatusMutation.mutate({ id: booking.id, status })}
                              >
                                <SelectTrigger className="w-28 h-8 text-xs rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="待確認">待確認</SelectItem>
                                  <SelectItem value="已確認">已確認</SelectItem>
                                  <SelectItem value="已完成">已完成</SelectItem>
                                  <SelectItem value="已取消">已取消</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}