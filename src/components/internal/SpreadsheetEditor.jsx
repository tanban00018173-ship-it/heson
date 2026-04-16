import React, { useState, useRef, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Trash2, Plus, Type } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function SpreadsheetEditor({ spreadsheetId, spreadsheetName, isBookingSheet = false, bookings = [] }) {
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

  const BOOKING_COLUMNS = [
    { key: 'client_name', label: '客戶姓名' },
    { key: 'service_type', label: '服務類型' },
    { key: 'scheduled_date', label: '預約日期' },
    { key: 'time_slot', label: '時段' },
    { key: 'status', label: '狀態' },
    { key: 'address', label: '地址' },
    { key: 'cleaner_name', label: '指派管理師' },
    { key: 'notes', label: '備註' },
    { key: 'created_date', label: '建立時間' },
  ];

  const convertBookingsToData = (bookingsList) => {
    const data = [BOOKING_COLUMNS.map(c => c.label)];
    bookingsList.forEach(b => {
      const row = BOOKING_COLUMNS.map(col => {
        if (col.key === 'created_date' && b[col.key]) {
          return new Date(b[col.key]).toLocaleDateString('zh-TW');
        }
        return b[col.key] ?? '';
      });
      data.push(row);
    });
    return data;
  };

  const { data: sheetData, isLoading, refetch } = useQuery({
    queryKey: ['customSheet', spreadsheetId],
    queryFn: async () => {
      if (isBookingSheet) {
        const data = convertBookingsToData(bookings);
        return {
          id: 'booking',
          spreadsheet_id: spreadsheetId,
          data,
          row_count: data.length,
          col_count: BOOKING_COLUMNS.length,
          col_widths: Array(BOOKING_COLUMNS.length).fill(120),
          row_heights: Array(data.length).fill(30),
          cell_formats: {},
          col_names: BOOKING_COLUMNS.map(c => c.label)
        };
      }

      const sheets = await base44.entities.CustomSheet.filter({ spreadsheet_id: spreadsheetId });
      if (sheets.length === 0) {
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
      return sheets[0];
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updates) => base44.entities.CustomSheet.update(sheetData.id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customSheet', spreadsheetId] }),
  });

  const changeZoom = (delta) => setZoom(z => Math.min(2, Math.max(0.4, +(z + delta).toFixed(1))));

  const handleCellChange = (row, col, value) => {
    if (!sheetData || isBookingSheet) return; // 預約表只讀
    const newData = sheetData.data.map(r => [...r]);
    newData[row][col] = value;
    updateMutation.mutate({ data: newData });
    setEditCell(null);
  };

  const insertCol = (beforeCol) => {
    if (!sheetData || isBookingSheet) return;
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
    if (!sheetData || isBookingSheet || sheetData.col_count <= 1) return;
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
    if (!sheetData || isBookingSheet) return;
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
    if (!sheetData || isBookingSheet) return;
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
    if (!sheetData || isBookingSheet || sheetData.row_count <= 1) return;
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
    if (!sheetData || isBookingSheet) return;
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
    if (!sheetData || isBookingSheet || !newColName.trim()) return;
    const newColNames = [...sheetData.col_names];
    newColNames[colIdx] = newColName;
    updateMutation.mutate({ col_names: newColNames });
    setRenamingCol(null);
    setNewColName('');
    setContextMenu(null);
  };

  if (isLoading || !sheetData) {
    return <div className="flex items-center justify-center h-40">載入中...</div>;
  }

  const filteredData = isBookingSheet ? sheetData.data.filter((row, idx) => {
    if (idx === 0 || !searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return row.some(cell => String(cell).toLowerCase().includes(q));
  }) : sheetData.data;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Info bar with search and zoom */}
      <div className="px-4 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs text-stone-600 gap-3">
        <span>{spreadsheetName} · {sheetData.row_count} 行 × {sheetData.col_count} 列</span>
        {isBookingSheet && (
          <>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋..."
              className="px-2 py-1 text-xs border border-stone-300 rounded"
            />
            {searchTerm && <span className="text-stone-500">找到 {filteredData.length - 1} 筆</span>}
          </>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => changeZoom(-0.1)} className="p-1 hover:bg-stone-200 text-stone-600">−</button>
          <span className="w-10 text-center text-xs text-stone-600">{Math.round(zoom * 100)}%</span>
          <button onClick={() => changeZoom(0.1)} className="p-1 hover:bg-stone-200 text-stone-600">+</button>
        </div>
      </div>

      {/* Table */}
      <div ref={tableRef} className="flex-1 overflow-auto">
        <table className="border-collapse border border-stone-300 bg-white" style={{ transformOrigin: 'top left', transform: `scale(${zoom})`, width: `${100 / zoom}%` }}>
          <thead>
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
            {filteredData.map((row, rowIdx) => (
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
                  const format = sheetData.cell_formats?.[`${rowIdx}_${colIdx}`] || {};
                  const isEditing = !isBookingSheet && editCell?.row === rowIdx && editCell?.col === colIdx;
                  return (
                    <td
                      key={`${rowIdx}_${colIdx}`}
                      style={{
                        width: sheetData.col_widths[colIdx],
                        height: sheetData.row_heights[rowIdx],
                        backgroundColor: format.bg || 'white',
                        color: format.color || 'black',
                        fontWeight: format.bold ? 'bold' : 'normal'
                      }}
                      className={`border border-stone-300 px-2 py-1 text-xs ${isBookingSheet ? 'cursor-default' : 'cursor-cell'}`}
                      onClick={() => !isBookingSheet && setEditCell({ row: rowIdx, col: colIdx })}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (!isBookingSheet) {
                          setContextMenu({ x: e.clientX, y: e.clientY, type: 'cell', row: rowIdx, col: colIdx });
                        }
                      }}
                    >
                      {isEditing ? (
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellChange(rowIdx, colIdx, editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellChange(rowIdx, colIdx, editValue);
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

      {/* Context menus - only for non-booking sheets */}
      {contextMenu && !isBookingSheet && (
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

      {/* Rename column dialog - only for non-booking sheets */}
      {!isBookingSheet && (
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
      )}

      {/* Cell format dialog - only for non-booking sheets */}
      {!isBookingSheet && (
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
      )}
    </div>
  );
}