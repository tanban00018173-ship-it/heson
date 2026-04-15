import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2, Eye, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function SheetSyncLog() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (auth) {
        const u = await base44.auth.me();
        setUser(u);
        if (u.role !== 'admin') window.location.href = '/';
      }
    });
  }, []);

  // 獲取GoogleSheetLog記錄
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['sheetSyncLogs'],
    queryFn: () => base44.entities.GoogleSheetLog.list('-created_date', 50),
  });

  // 獲取Booking記錄
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 20),
  });

  const openSheetLink = () => {
    window.open('https://docs.google.com/spreadsheets/d/1lQc70QbKE0U_BvG7LNa_iR9AymWzO4y5g4SkDo0LtHY/edit?usp=sharing', '_blank');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-stone-600">僅管理員可訪問此頁面</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-stone-800 mb-2">Google Sheet 同步日誌</h1>
            <p className="text-stone-600">監控預約表單自動填寫到 Google Sheet 的狀況</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={openSheetLink}
              variant="outline"
              className="rounded-xl"
            >
              <Eye className="w-4 h-4 mr-2" /> 查看 Google Sheet
            </Button>
            <Button
              onClick={() => refetch()}
              className="bg-stone-800 hover:bg-stone-900 rounded-xl"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> 重新整理
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 統計卡片 */}
          <div className="lg:col-span-3 grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-amber-600 mb-2">{bookings.length}</p>
                <p className="text-sm text-stone-600">總預約數</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {logs.filter(l => l.status === 'success').length}
                </p>
                <p className="text-sm text-stone-600">成功同步</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-red-600 mb-2">
                  {logs.filter(l => l.status === 'failed').length}
                </p>
                <p className="text-sm text-stone-600">同步失敗</p>
              </CardContent>
            </Card>
          </div>

          {/* 同步日誌列表 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-amber-600" />
                  同步日誌
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-stone-500 text-center py-8">暫無同步記錄</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-4 rounded-lg border ${
                          log.status === 'success'
                            ? 'bg-green-50 border-green-200'
                            : log.status === 'failed'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {log.status === 'success' ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-600" />
                              )}
                              <p className="font-medium text-stone-800">
                                {log.operation_type === 'ai_fill' ? 'AI 自動填寫' : '手動編輯'}
                              </p>
                            </div>
                            <p className="text-xs text-stone-500 mt-1">
                              {new Date(log.created_date).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
                            </p>
                            {log.error_message && (
                              <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                            )}
                            {log.data_filled && (
                              <div className="text-xs text-stone-600 mt-2 bg-white/50 p-2 rounded">
                                <p className="font-medium mb-1">填寫內容：</p>
                                {Object.entries(log.data_filled).map(([key, value]) => (
                                  <p key={key}>{key}: {value}</p>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                            log.status === 'success'
                              ? 'bg-green-200 text-green-800'
                              : log.status === 'failed'
                              ? 'bg-red-200 text-red-800'
                              : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {log.status === 'success' ? '成功' : log.status === 'failed' ? '失敗' : '待審核'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 最近預約 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>最近預約</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-stone-500 text-center py-8">暫無預約</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {bookings.slice(0, 10).map((booking) => (
                      <div
                        key={booking.id}
                        className="p-3 bg-stone-50 rounded-lg border border-stone-200"
                      >
                        <p className="font-medium text-sm text-stone-800">{booking.client_name}</p>
                        <p className="text-xs text-stone-500 mt-1">{booking.phone}</p>
                        <p className="text-xs text-stone-600 mt-1">{booking.scheduled_date}</p>
                        <div className="mt-2 flex gap-1">
                          <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                            {booking.service_type}
                          </span>
                          <span className={`inline-block px-2 py-1 text-xs rounded ${
                            booking.status === '已完成' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}