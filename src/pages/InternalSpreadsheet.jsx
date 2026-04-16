import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Loader2, ExternalLink, Eye } from "lucide-react";

export default function InternalSpreadsheet() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [bookingCount, setBookingCount] = useState(0);

  const SPREADSHEET_ID = '10kfWum36sfQyzIMlh0AF_l6dTVwurY4lahbo2eUVrbw';
  const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?usp=drivesdk`;

  useEffect(() => {
    const check = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const me = await base44.auth.me();
      if (me.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(me);
      setAuthChecked(true);
    };
    check();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    const fetchBookings = async () => {
      const bookings = await base44.entities.Booking.list('-created_date', 500);
      setBookingCount(bookings.length);
    };
    fetchBookings();
  }, [authChecked]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('syncBookingToGoogleSheet', {});
      setLastSync(new Date().toLocaleTimeString('zh-TW'));
    } catch (err) {
      console.error('Sync failed:', err);
    }
    setSyncing(false);
  };

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-stone-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0 h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-stone-800 text-sm">試算表管理</h1>
            <p className="text-xs text-stone-400">清潔訂單 · 共 {bookingCount} 筆</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastSync && (
            <Badge variant="outline" className="text-xs text-stone-500">
              最後同步: {lastSync}
            </Badge>
          )}
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="gap-2 text-xs"
          >
            {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            同步到 Google Sheets
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(SPREADSHEET_URL, '_blank')}
            className="gap-2 text-xs"
          >
            <ExternalLink className="w-3 h-3" />
            開啟試算表
          </Button>
        </div>
      </div>

      {/* Google Sheets Embed */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?usp=drivesdk&rm=embedded`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Google Sheets Booking"
        />
      </div>

      {/* Info Bar */}
      <div className="bg-stone-50 border-t border-stone-200 px-4 py-2 text-xs text-stone-500 flex items-center gap-4">
        <div>💡 按上方「同步到 Google Sheets」按鈕，將最新的預約資料自動填入試算表</div>
      </div>
    </div>
  );
}