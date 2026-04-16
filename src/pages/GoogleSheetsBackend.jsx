import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

export default function GoogleSheetsBackend() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

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
      
      // Init or fetch sheet
      initSheet();
    };
    check();
  }, []);

  const initSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('initGoogleSheet', {});
      setSheetUrl(res.data.spreadsheet_url);
    } catch (err) {
      setError(err.message || 'Failed to initialize Google Sheet');
    }
    setLoading(false);
  };

  const syncNow = async () => {
    setSyncLoading(true);
    try {
      const res = await base44.functions.invoke('syncBookingsToGoogleSheet', {});
      alert(`已同步 ${res.data.rows_synced} 筆訂單`);
    } catch (err) {
      alert('同步失敗: ' + (err.message || 'Unknown error'));
    }
    setSyncLoading(false);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">Google Sheets 試算表</h1>
          <p className="text-stone-500 mb-8">自動同步所有 Booking 資料到 Google Sheets</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">初始化失敗</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : sheetUrl ? (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <p className="text-sm text-stone-600 mb-3">試算表網址</p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={sheetUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm bg-white border border-blue-300 rounded-lg text-blue-600"
                  />
                  <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <a href={sheetUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      開啟
                    </a>
                  </Button>
                </div>
              </div>

              <div className="p-6 bg-stone-50 rounded-xl border border-stone-200">
                <h2 className="font-semibold text-stone-800 mb-4">資料同步</h2>
                <p className="text-sm text-stone-600 mb-4">
                  每當 Booking 變更時會自動同步。也可以手動同步最新資料：
                </p>
                <Button
                  onClick={syncNow}
                  disabled={syncLoading}
                  className="bg-amber-600 hover:bg-amber-700 gap-2"
                >
                  {syncLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  立即同步
                </Button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                💡 <strong>提示：</strong>試算表已自動設定為管理員專用。Booking 新增、修改、刪除時會自動更新。
              </div>
            </div>
          ) : (
            <Button onClick={initSheet} className="bg-amber-600 hover:bg-amber-700">
              初始化 Google Sheets
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}