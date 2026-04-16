import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, RefreshCw, ArrowLeft } from "lucide-react";

export default function GoogleSheetViewer() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sheetId, setSheetId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetUrl, setSheetUrl] = useState(null);

  useEffect(() => {
    const init = async () => {
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

      // Initialize/get sheet
      try {
        const res = await base44.functions.invoke('initGoogleSheet', {});
        setSheetId(res.data.sheetId);
        setSheetUrl(res.data.sheetUrl);
      } catch (err) {
        console.error('Failed to init sheet:', err);
      }

      setLoading(false);
    };

    init();
  }, [navigate]);

  const handleRefresh = async () => {
    if (!sheetId) return;
    setLoading(true);
    try {
      await base44.functions.invoke('syncBookingToGoogleSheet', { sheetId });
    } catch (err) {
      console.error('Sync failed:', err);
    }
    setLoading(false);
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-semibold text-stone-800">Google Sheets 試算表管理</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            重新同步
          </Button>
          {sheetUrl && (
            <Button asChild size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
              <a href={sheetUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                開啟試算表
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Sheet Embed */}
      <div className="flex-1 p-4">
        {sheetId ? (
          <iframe
            src={`https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing`}
            className="w-full h-full rounded-lg border border-stone-200"
            allowFullScreen
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-white rounded-lg border border-stone-200">
            <div className="text-center text-stone-400">
              <p>試算表初始化中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}