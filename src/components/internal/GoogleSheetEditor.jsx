import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Edit2, Check, X, RefreshCw, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function GoogleSheetEditor({ spreadsheetId, spreadsheetName }) {
  const [editCell, setEditCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['googleSheetBookings', spreadsheetId],
    queryFn: async () => {
      const res = await base44.functions.invoke('fetchGoogleSheetBookings', { spreadsheetId });
      return res.data?.data || [];
    },
    enabled: !!spreadsheetId
  });

  const updateMutation = useMutation({
    mutationFn: async ({ rowIdx, colName, newValue }) => {
      // Update in Google Sheets via API
      const colIdx = headers.indexOf(colName);
      if (colIdx === -1) throw new Error('Column not found');
      
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
      const cellRange = String.fromCharCode(65 + colIdx) + (rowIdx + 2); // +2 because of header + 1-indexed
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${cellRange}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: [[newValue]] })
        }
      );

      if (!response.ok) throw new Error('Failed to update cell');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['googleSheetBookings'] });
    }
  });

  const initMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('initGoogleSheet', { 
        spreadsheetId,
        bookings: await base44.entities.Booking.list('-created_date', 500)
      });
      return res.data;
    },
    onSuccess: () => {
      refetch();
    }
  });

  const headers = bookings.length > 0 ? Object.keys(bookings[0]) : ['客戶姓名', '服務類型', '預約日期', '時段', '狀態', '地址', '指派管理師', '備註', '建立時間'];

  const handleCellChange = (rowIdx, colName, newValue) => {
    if (bookings[rowIdx][colName] !== newValue) {
      updateMutation.mutate({ rowIdx, colName, newValue });
    }
    setEditCell(null);
  };

  useEffect(() => {
    setSheetUrl(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
  }, [spreadsheetId]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="px-4 py-3 bg-white border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-stone-700">{spreadsheetName} · {bookings.length} 筆資料</span>
          <Button 
            variant="outline"
            size="sm" 
            onClick={() => refetch()} 
            disabled={isLoading}
            className="gap-1 text-xs h-7 px-2"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            重整
          </Button>
          {spreadsheetUrl && (
            <a 
              href={spreadsheetUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              在 Google Sheets 開啟
            </a>
          )}
        </div>
        <Button 
          onClick={() => initMutation.mutate()}
          disabled={initMutation.isPending}
          className="gap-1 text-xs"
        >
          {initMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : '同步預約資料'}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <AlertCircle className="w-8 h-8 text-stone-300" />
            <p className="text-sm text-stone-400">尚無資料</p>
            <Button 
              onClick={() => initMutation.mutate()}
              disabled={initMutation.isPending}
              size="sm"
              className="gap-1"
            >
              {initMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : '從預約系統匯入'}
            </Button>
          </div>
        ) : (
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="border-b border-stone-300">
                <th className="w-10 h-8 bg-stone-100 border border-stone-300 text-xs font-medium text-stone-600"></th>
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="h-8 border border-stone-300 px-3 text-xs font-medium text-stone-700 bg-stone-100 text-left"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-stone-200 hover:bg-stone-50">
                  <td className="w-10 h-8 bg-stone-50 border border-stone-200 text-xs text-center text-stone-600 font-medium">
                    {rowIdx + 1}
                  </td>
                  {headers.map((header, colIdx) => {
                    const isEditing = editCell?.row === rowIdx && editCell?.col === colIdx;
                    const cellValue = row[header] || '';

                    return (
                      <td
                        key={`${rowIdx}_${colIdx}`}
                        className="border border-stone-200 px-3 py-2 text-xs cursor-pointer hover:bg-amber-50"
                        onClick={() => {
                          setEditCell({ row: rowIdx, col: colIdx });
                          setEditValue(cellValue);
                        }}
                      >
                        {isEditing ? (
                          <Input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellChange(rowIdx, header, editValue)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCellChange(rowIdx, header, editValue);
                              if (e.key === 'Escape') setEditCell(null);
                            }}
                            className="h-6 p-1 text-xs border-0 shadow-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="truncate">{cellValue}</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}