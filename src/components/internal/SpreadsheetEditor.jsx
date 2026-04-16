import React, { useState, useRef, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Trash2, Plus, Type, Search, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";

export default function SpreadsheetEditor({ spreadsheetId, spreadsheetName, isBookingSheet = false }) {
  const queryClient = useQueryClient();
  const [editCell, setEditCell] = useState(null); // { row, col }
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null); // { x, y, type, index }
  const [formatDialog, setFormatDialog] = useState(null); // { row, col }
  const [formatData, setFormatData] = useState({ bg: '#ffffff', color: '#000000', bold: false });
  const [renamingCol, setRenamingCol] = useState(null);
  const [newColName, setNewColName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);
  const tableRef = useRef(null);

  const { data: sheetData, isLoading, refetch } = useQuery({
    queryKey: ['customSheet', spreadsheetId],
    queryFn: async () => {
      const sheets = await base44.entities.CustomSheet.filter({ spreadsheet_id: spreadsheetId });
      if (sheets.length === 0) {
        if (isBookingSheet) {
          // 從 Booking 導入資料
          const bookings = await base44.entities.Booking.list('-created_date', 500);
          const bookingData = bookings.map(b => [
            b.client_name || '',
            b.service_type || '',
            b.scheduled_date ? format(new Date(b.scheduled_date), 'yyyy-MM-dd') : '',
            b.time_slot || '',
            b.status || '',
            b.address || '',
            b.cleaner_name || '',
            b.notes || '',
            b.created_date ? format(new Date(b.created_date), 'yyyy-MM-dd HH:mm') : ''
          ]);
          // 新增空行
          while (bookingData.length < 20) {
            bookingData.push(Array(9).fill(''));
          }
          const colNames = ['客戶姓名', '服務類型', '預約日期', '時段', '狀態', '地址', '管理師', '備註', '建立時間'];
          const newSheet = {
            spreadsheet_id: spreadsheetId,
            data: bookingData,
            row_count: bookingData.length,
            col_count: 9,
            col_widths: Array(9).fill(120),
            row_heights: Array(bookingData.length).fill(30),
            cell_formats: {},
            col_names: colNames
          };
          return await base44.entities.CustomSheet.create(newSheet);
        } else {
          // 建立空試算表
          const newSheet = {
            spreadsheet_id: spreadsheetId,
            data: Array(20).fill(null).map(() => Array(10).fill('')),
            row_count: 20,
            col_count: 10,
            col_widths: Array(10).fill(100),
            row_heights: Array(20).fill(30),
            cell_formats: {},
            col_names: Array(10).fill(null).map((_, i) => String.fromCharCode(65 + (i % 26)))
          };
          return await base44.entities.CustomSheet.create(newSheet);
        }
      }
      return sheets[0];
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updates) => base44.entities.CustomSheet.update(sheetData.id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customSheet', spreadsheetId] }),
  });

  const handleCellChange = (row, col, value) => {
    if (!sheetData) return;
    const newData = sheetData.data.map(r => [...r]);
    newData[row][col] = value;
    updateMutation.mutate({ data: newData });
    setEditCell(null);
  };

  const insertCol = (beforeCol) => {
    if (!sheetData) return;
    const newData = sheetData.data.map(row => {
      const newRow = [...row];
      newRow.splice(beforeCol, 0, '');
      return newRow;
    });
    const newColWidths = [...sheetData.col_widths];
    newColWidths.splice(beforeCol, 0, 100);
    const newColNames = [...sheetData.col_names];
    newColNames.splice(beforeCol, 0, String.fromCharCode(65 + (beforeCol % 26)));
    updateMutation.mutate({
      data: newData,
      col_widths: newColWidths,
      col_names: newColNames,
      col_count: sheetData.col_count + 1
    });
    setContextMenu(null);
  };

  const deleteCol = (colIdx) => {
    if (!sheetData || sheetData.col_count <= 1) return;
    const newData = sheetData.data.map(row => {
      const newRow = [...row];
      newRow.splice(colIdx, 1);
      return newRow;
    });
    const newColWidths = [...sheetData.col_widths];
    newColWidths.splice(colIdx, 1);
    const newColNames = [...sheetData.col_names];
    newColNames.splice(colIdx, 1);
    updateMutation.mutate({
      data: newData,
      col_widths: newColWidths,
      col_names: newColNames,
      col_count: sheetData.col_count - 1
    });
    setContextMenu(null);
  };

  const copyCol = (colIdx) => {
    if (!sheetData) return;
    const newData = sheetData.data.map(row => {
      const newRow = [...row];
      newRow.splice(colIdx + 1, 0, row[colIdx]);
      return newRow;
    });
    const newColWidths = [...sheetData.col_widths];
    newColWidths.splice(colIdx + 1, 0, sheetData.col_widths[colIdx]);
    const newColNames = [...sheetData.col_names];
    newColNames.splice(colIdx + 1, 0, sheetData.col_names[colIdx] + '\'');
    updateMutation.mutate({
      data: newData,
      col_widths: newColWidths,
      col_names: newColNames,
      col_count: sheetData.col_count + 1
    });
    setContextMenu(null);
  };

  const insertRow = (beforeRow) => {
    if (!sheetData) return;
    const newData = [...sheetData.data];
    newData.splice(beforeRow, 0, Array(sheetData.col_count).fill(''));
    const newRowHeights = [...sheetData.row_heights];
    newRowHeights.splice(beforeRow, 0, 30);
    updateMutation.mutate({
      data: newData,
      row_heights: newRowHeights,
      row_count: sheetData.row_count + 1
    });
    setContextMenu(null);
  };

  const deleteRow = (rowIdx) => {
    if (!sheetData || sheetData.row_count <= 1) return;
    const newData = [...sheetData.data];
    newData.splice(rowIdx, 1);
    const newRowHeights = [...sheetData.row_heights];
    newRowHeights.splice(rowIdx, 1);
    updateMutation.mutate({
      data: newData,
      row_heights: newRowHeights,
      row_count: sheetData.row_count - 1
    });
    setContextMenu(null);
  };

  const copyRow = (rowIdx) => {
    if (!sheetData) return;
    const newData = [...sheetData.data];
    newData.splice(rowIdx + 1, 0, [...newData[rowIdx]]);
    const newRowHeights = [...sheetData.row_heights];
    newRowHeights.splice(rowIdx + 1, 0, sheetData.row_heights[rowIdx]);
    updateMutation.mutate({
      data: newData,
      row_heights: newRowHeights,
      row_count: sheetData.row_count + 1
    });
    setContextMenu(null);
  };

  const applyFormat = (row, col) => {
    if (!sheetData || !formatDialog) return;
    const key = `${row}_${col}`;
    const newFormats = { ...sheetData.cell_formats, [key]: formatData };
    updateMutation.mutate({ cell_formats: newFormats });
    setFormatDialog(null);
  };

  const renameCol = (colIdx) => {
    if (!sheetData || !newColName.trim()) return;
    const newColNames = [...sheetData.col_names];
    newColNames[colIdx] = newColName;
    updateMutation.mutate({ col_names: newColNames });
    setRenamingCol(null);
    setNewColName('');
    setContextMenu(null);
  };

  const changeZoom = (delta) => setZoom(z => Math.min(2, Math.max(0.4, +(z + delta).toFixed(1))));

  const filteredData = sheetData?.data.filter((row, idx) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return row.some(cell => String(cell).toLowerCase().includes(q));
  }) || [];

  if (isLoading || !sheetData) {
    return <div className="flex items-center justify-center h-40">載入中...</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 bg-white border-b border-stone-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="搜尋試算表..."
            className="pl-8 h-8 text-xs"
          />
        </div>
        {searchTerm && (
          <span className="text-xs text-stone-400">找到 {filteredData.length} 筆</span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => changeZoom(-0.1)} className="p-1 rounded hover:bg-stone-100 text-stone-500"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-xs text-stone-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => changeZoom(0.1)} className="p-1 rounded hover:bg-stone-100 text-stone-500"><ZoomIn className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Table */}
      <div ref={tableRef} className="flex-1 overflow-auto">
        <table className="border-collapse border border-stone-300 bg-white" style={{ transformOrigin: 'top left', transform: `scale(${zoom})`, width: `${100 / zoom}%` }}>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-8 h-7 bg-stone-100 border border-stone-300 text-xs text-stone-500 text-center"></th>
              {sheetData.col_names.map((name, colIdx) => (
                <th
                  key={colIdx}
                  style={{ width: sheetData.col_widths[colIdx] }}
                  className="h-7 bg-stone-100 border border-stone-300 px-2 text-xs font-medium text-stone-700 cursor-pointer hover:bg-stone-200 relative group"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'col', index: colIdx });
                  }}
                >
                  <div className="truncate">{name || `Col ${colIdx + 1}`}</div>
                  <div className="hidden group-hover:block absolute top-0 right-0 text-[8px] text-stone-500">⋮</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={sheetData.col_count + 1} className="text-center py-12 text-stone-400">
                  {searchTerm ? '找不到符合的資料' : '暫無資料'}
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td
                  className="w-8 bg-stone-100 border border-stone-300 text-xs text-stone-500 text-center cursor-pointer hover:bg-stone-200 font-medium"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'row', index: rowIdx });
                  }}
                >
                  {rowIdx + 1}
                </td>
                {row.map((cell, colIdx) => {
                  const actualRowIdx = sheetData.data.indexOf(row);
                  const format = sheetData.cell_formats?.[`${actualRowIdx}_${colIdx}`] || {};
                  const isEditing = editCell?.row === actualRowIdx && editCell?.col === colIdx;
                  return (
                    <td
                      key={`${actualRowIdx}_${colIdx}`}
                      style={{
                        width: sheetData.col_widths[colIdx],
                        height: sheetData.row_heights[actualRowIdx],
                        backgroundColor: format.bg || 'white',
                        color: format.color || 'black',
                        fontWeight: format.bold ? 'bold' : 'normal'
                      }}
                      className="border border-stone-300 px-2 py-1 text-xs cursor-cell"
                      onClick={() => setEditCell({ row: actualRowIdx, col: colIdx })}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, type: 'cell', row: actualRowIdx, col: colIdx });
                      }}
                    >
                      {isEditing ? (
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellChange(actualRowIdx, colIdx, editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellChange(actualRowIdx, colIdx, editValue);
                            if (e.key === 'Escape') setEditCell(null);
                          }}
                          className="h-6 p-1 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="truncate">{cell}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Context menus */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-white border border-stone-200 rounded-lg shadow-lg py-1 min-w-[150px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.type === 'col' && (
              <>
                <button
                  onClick={() => insertCol(contextMenu.index)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-stone-100"
                >
                  <Plus className="w-3 h-3" /> 新增左欄
                </button>
                <button
                  onClick={() => insertCol(contextMenu.index + 1)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-stone-100"
                >
                  <Plus className="w-3 h-3" /> 新增右欄
                </button>
                <button
                  onClick={() => copyCol(contextMenu.index)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-stone-100"
                >
                  <Copy className="w-3 h-3" /> 複製
                </button>
                <button
                  onClick={() => {
                    setRenamingCol(contextMenu.index);
                    setNewColName(sheetData.col_names[contextMenu.index] || '');
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-stone-100"
                >
                  <Type className="w-3 h-3" /> 重新命名
                </button>
                {sheetData.col_count > 1 && (
                  <button
                    onClick={() => deleteCol(contextMenu.index)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" /> 刪除
                  </button>
                )}
              </>
            )}
            {contextMenu.type === 'row' && (
              <>
                <button
                  onClick={() => insertRow(contextMenu.index)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-stone-100"
                >
                  <Plus className="w-3 h-3" /> 新增上方
                </button>
                <button
                  onClick={() => insertRow(contextMenu.index + 1)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-stone-100"
                >
                  <Plus className="w-3 h-3" /> 新增下方
                </button>
                <button
                  onClick={() => copyRow(contextMenu.index)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-stone-100"
                >
                  <Copy className="w-3 h-3" /> 複製
                </button>
                {sheetData.row_count > 1 && (
                  <button
                    onClick={() => deleteRow(contextMenu.index)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" /> 刪除
                  </button>
                )}
              </>
            )}
            {contextMenu.type === 'cell' && (
              <button
                onClick={() => {
                  setFormatDialog({ row: contextMenu.row, col: contextMenu.col });
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-stone-100"
              >
                設定格式
              </button>
            )}
          </div>
        </>
      )}

      {/* Rename column dialog */}
      <Dialog open={renamingCol !== null} onOpenChange={() => setRenamingCol(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重新命名欄位</DialogTitle>
          </DialogHeader>
          <Input
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            placeholder="輸入新名稱..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') renameCol(renamingCol);
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingCol(null)}>取消</Button>
            <Button onClick={() => renameCol(renamingCol)}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cell format dialog */}
      <Dialog open={!!formatDialog} onOpenChange={() => setFormatDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>設定單元格格式</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">背景色</label>
              <input
                type="color"
                value={formatData.bg}
                onChange={(e) => setFormatData({ ...formatData, bg: e.target.value })}
                className="w-full h-8 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs font-medium">文字色</label>
              <input
                type="color"
                value={formatData.color}
                onChange={(e) => setFormatData({ ...formatData, color: e.target.value })}
                className="w-full h-8 cursor-pointer"
              />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={formatData.bold}
                onChange={(e) => setFormatData({ ...formatData, bold: e.target.checked })}
              />
              粗體
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormatDialog(null)}>取消</Button>
            <Button onClick={() => applyFormat(formatDialog.row, formatDialog.col)}>套用</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}