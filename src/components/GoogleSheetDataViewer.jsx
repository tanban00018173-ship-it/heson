import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleSheetDataViewer({ spreadsheetId }) {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSheetData = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('fetchGoogleSheetData', {
        spreadsheet_id: spreadsheetId,
      });

      if (response.data.success) {
        setHeaders(response.data.headers || []);
        setData(response.data.rows || []);
        toast.success(`已加載 ${response.data.rows?.length || 0} 筆資料`);
      } else {
        toast.error('讀取失敗：' + response.data.error);
      }
    } catch (err) {
      toast.error('無法連接 Google Sheet：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (spreadsheetId) {
      loadSheetData();
    }
  }, [spreadsheetId]);

  const getRowLabel = (index) => {
    return `L${index}`;
  };

  const getStatusColor = (value) => {
    if (!value) return 'bg-gray-100 text-gray-600';
    if (value.includes('已確認') || value.includes('是')) return 'bg-green-100 text-green-800';
    if (value.includes('待') || value.includes('未')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-stone-100 text-stone-800';
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Google Sheet 即時資料</CardTitle>
          <p className="text-sm text-stone-500 mt-1">顯示表格中的實時內容</p>
        </div>
        <Button
          size="sm"
          onClick={loadSheetData}
          disabled={loading}
          className="gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          刷新
        </Button>
      </CardHeader>
      <CardContent>
        {loading && data.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            <p>尚無資料</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-3 py-2 text-left font-medium text-stone-700 w-12">行號</th>
                  {headers.map((header, idx) => (
                    <th key={idx} className="px-3 py-2 text-left font-medium text-stone-700 whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIdx) => {
                  // 檢查行是否有實質內容（不全是空值）
                  const hasContent = row.some(cell => cell && cell.toString().trim() !== '');
                  if (!hasContent) return null;

                  return (
                    <tr key={rowIdx} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                      <td className="px-3 py-2 font-bold text-stone-700 bg-orange-50 sticky left-0">
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                          {getRowLabel(rowIdx + 1)}
                        </Badge>
                      </td>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-3 py-2 text-stone-700 max-w-xs truncate">
                          {cell ? (
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(cell.toString())}`}>
                              {cell.toString().substring(0, 50)}
                              {cell.toString().length > 50 ? '...' : ''}
                            </span>
                          ) : (
                            <span className="text-stone-300">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}