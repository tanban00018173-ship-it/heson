import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink } from "lucide-react";

const SPREADSHEET_ID = '10kfWum36sfQyzIMlh0AF_l6dTVwurY4lahbo2eUVrbw';
const SHEET_NAME = '清潔訂單';

export default function GoogleSheetViewer({ showToolbar = true }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('syncBookingToGoogleSheet', {});
      setLastSync(new Date().toLocaleTimeString('zh-TW'));
    } catch (err) {
      console.error('Sync failed:', err);
      alert('同步失敗: ' + (err.message || '未知錯誤'));
    }
    setSyncing(false);
  };

  useEffect(() => {
    // Auto-sync on component mount
    handleSync();
  }, []);

  const embedUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?usp=drivesdk`;
  const iframeUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/preview`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Toolbar */}
      {showToolbar && (
        <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-stone-700">{SHEET_NAME}</h2>
            {lastSync && (
              <span className="text-xs text-stone-400">最後同步: {lastSync}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSync}
              disabled={syncing}
              size="sm"
              variant="outline"
              className="gap-1 text-xs px-2"
            >
              {syncing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">同步</span>
            </Button>
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">在 Google Sheets 中開啟</span>
            </a>
          </div>
        </div>
      )}

      {/* Embedded Google Sheet */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={iframeUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '0'
          }}
          allowFullScreen
          title="Google Sheets - 清潔訂單"
        />
      </div>
    </div>
  );
}