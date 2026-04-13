import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, MapPin, User, Filter, UserPlus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function AdminBookings() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignBooking, setAssignBooking] = useState(null);
  const [assignCleaner, setAssignCleaner] = useState('');
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

  const { data: cleaners } = useQuery({
    queryKey: ['activeCleaners'],
    queryFn: async () => {
      const all = await base44.entities.CleanerProfile.list();
      return all.filter(c => c.is_active);
    },
    initialData: [],
  });

  const assignMutation = useMutation({
    mutationFn: ({ bookingId, cleanerId }) =>
      base44.functions.invoke('dispatchCleaner', { bookingId, cleanerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
      toast.success('指派成功！通知 Email 已發送');
      setAssignBooking(null);
      setAssignCleaner('');
    },
    onError: (err) => {
      toast.error('指派失敗：' + (err?.message || '請稍後再試'));
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
                              <div className="flex items-center gap-2">
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
                                {booking.status === '待確認' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs rounded-lg text-amber-600 border-amber-300 hover:bg-amber-50"
                                    onClick={() => { setAssignBooking(booking); setAssignCleaner(''); }}
                                  >
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    指派
                                  </Button>
                                )}
                              </div>
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

      {/* Assign Dialog */}
      <Dialog open={!!assignBooking} onOpenChange={() => setAssignBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>指派服務人員</DialogTitle>
          </DialogHeader>
          {assignBooking && (
            <div className="space-y-4">
              <div className="bg-stone-50 rounded-xl p-4 text-sm">
                <p className="font-medium text-stone-800">{assignBooking.client_name}</p>
                <p className="text-stone-500 mt-1">{assignBooking.service_type}</p>
                <p className="text-stone-500">
                  {assignBooking.scheduled_date && format(new Date(assignBooking.scheduled_date), 'M月d日 (EEE)', { locale: zhTW })} · {assignBooking.time_slot}
                </p>
                <p className="text-stone-400 mt-1 truncate">{assignBooking.address}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">選擇管理師</label>
                <Select value={assignCleaner} onValueChange={setAssignCleaner}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="請選擇管理師" />
                  </SelectTrigger>
                  <SelectContent>
                    {cleaners?.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nickname}（{c.service_areas?.join('、') || '全區'}）
                      </SelectItem>
                    ))}
                    {cleaners?.length === 0 && (
                      <SelectItem value="__none" disabled>尚無可用管理師</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-stone-400">指派後將自動發送 Email 通知給管理師，並更新預約狀態為「已確認」。</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignBooking(null)}>取消</Button>
            <Button
              onClick={() => assignMutation.mutate({ bookingId: assignBooking.id, cleanerId: assignCleaner })}
              disabled={!assignCleaner || assignMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {assignMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />處理中...</> : '確認指派'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}