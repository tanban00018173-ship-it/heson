import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ArrowLeft, ExternalLink } from "lucide-react";

const SPREADSHEET_ID = '1lQc70QbKE0U_BvG7LNa_iR9AymWzO4y5g4SkDo0LtHY';
const SHEET_NAME = encodeURIComponent('清潔訂單');

export default function GoogleSheetViewer() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

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

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

  return (
    <div className="h-screen bg-stone-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0 h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-semibold text-stone-800 text-sm">Google 試算表</h1>
            <p className="text-xs text-stone-400">即時同步清潔訂單資料</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="outline"
            size="sm"
            className="gap-1 text-xs px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '同步中...' : '同步'}
          </Button>
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1 text-xs px-3">
              <ExternalLink className="w-3.5 h-3.5" />
              開啟
            </Button>
          </a>
        </div>
      </div>

      {/* Last sync info */}
      {lastSync && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          最後同步：{lastSync}
        </div>
      )}

      {/* Google Sheet Embed */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={`${sheetUrl}?rm=minimal`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Google Sheet"
        />
      </div>
    </div>
  );
}