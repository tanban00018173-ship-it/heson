import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ExternalLink, Copy, Check } from "lucide-react";

export default function GoogleSheetsBackend() {
  const [user, setUser] = useState(null);
  const [spreadsheetId, setSpreadsheetId] = useState(() => localStorage.getItem('bookingSheetId') || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const check = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const me = await base44.auth.me();
      if (me.role !== 'admin') { window.location.href = '/'; return; }
      setUser(me);
    };
    check();
  }, []);

  const createSheet = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('initGoogleSheet', {});
      setSpreadsheetId(res.data.spreadsheetId);
      localStorage.setItem('bookingSheetId', res.data.spreadsheetId);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const saveSheetId = () => {
    if (spreadsheetId.trim()) {
      localStorage.setItem('bookingSheetId', spreadsheetId.trim());
      setError('');
    } else {
      setError('試算表 ID 不能為空');
    }
  };

  const copySheetId = () => {
    navigator.clipboard.writeText(spreadsheetId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return <div className="flex items-center justify-center h-40">載入中...</div>;

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h1 className="text-2xl font-bold text-stone-800">Google Sheets 後台設定</h1>
          <p className="text-stone-600">設定試算表 ID 後，Booking 變更會自動同步</p>

          <div className="space-y-3 pt-4">
            <div>
              <label className="text-sm font-medium text-stone-700">試算表 ID</label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="貼上 Google Sheet ID"
                  className="flex-1"
                />
                <Button
                  onClick={copySheetId}
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={saveSheetId} className="bg-blue-600 hover:bg-blue-700">保存 ID</Button>
              <Button onClick={createSheet} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                建立新試算表
              </Button>
              {spreadsheetId && (
                <Button
                  asChild
                  variant="outline"
                  className="gap-2"
                >
                  <a href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`} target="_blank">
                    <ExternalLink className="w-4 h-4" /> 開啟試算表
                  </a>
                </Button>
              )}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {spreadsheetId && <Badge className="bg-green-100 text-green-700">已設定</Badge>}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 mt-6">
            <p>💡 設定後請建立 entity automation：</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Entity: <code className="bg-white px-1 rounded">Booking</code></li>
              <li>Event: <code className="bg-white px-1 rounded">create, update</code></li>
              <li>Function: <code className="bg-white px-1 rounded">syncBookingToGoogleSheet</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}