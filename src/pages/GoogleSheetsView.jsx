import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, ExternalLink, Loader2 } from "lucide-react";

export default function GoogleSheetsView() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [spreadsheetId, setSpreadsheetId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    const check = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const me = await base44.auth.me();
      if (me.role !== 'admin') {
        navigate('/');
        return;
      }
      setUser(me);
      
      // 取得最後同步的試算表 ID
      const logs = await base44.entities.GoogleSheetLog.filter({ spreadsheet_id: 'heson_bookings_sync' });
      if (logs.length > 0) {
        setSpreadsheetId('heson_bookings_sync');
      }
    };
    check();
  }, [navigate]);

  const handleSync = async () => {
    setLoading(true);
    setSyncStatus('同步中...');
    try {
      const res = await base44.functions.invoke('syncBookingsToGoogleSheet', {});
      setSpreadsheetId(res.data.spreadsheetId);
      setLastSync(new Date().toLocaleString('zh-TW'));
      setSyncStatus('✓ 同步成功！' + res.data.rowCount + ' 筆資料');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err) {
      setSyncStatus('✗ 同步失敗：' + err.message);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const sheetUrl = spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}` : null;

  return (
    <div className="h-screen bg-stone-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-stone-800 text-sm">Google Sheets 試算表</h1>
            {lastSync && <p className="text-xs text-stone-400">最後同步：{lastSync}</p>}
          </div>
        </div>
        <Button
          onClick={handleSync}
          disabled={loading}
          className="gap-2 bg-amber-500 hover:bg-amber-600"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? '同步中' : '重新同步'}
        </Button>
      </div>

      {/* Status message */}
      {syncStatus && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-700">
          {syncStatus}
        </div>
      )}

      {/* Google Sheets embed */}
      <div className="flex-1 overflow-hidden">
        {spreadsheetId ? (
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 bg-white border-b border-stone-200 flex items-center justify-between text-sm">
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                在 Google Sheets 中開啟
                <ExternalLink className="w-3 h-3" />
              </a>
              <Badge className="bg-green-100 text-green-700">已連接</Badge>
            </div>
            <iframe
              src={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing&embed=true`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center flex-col gap-4">
            <p className="text-stone-400 text-center">
              尚未建立 Google Sheet<br />
              點擊上方「重新同步」按鈕開始
            </p>
            <Button onClick={handleSync} className="bg-amber-500 hover:bg-amber-600">
              建立並同步
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}