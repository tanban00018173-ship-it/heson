import React, { useState, useRef, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Undo2, Plus, Trash2, Copy, Type } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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

export default function SpreadsheetEditor({ spreadsheetId, spreadsheetName, isBookingSheet = false, bookings = [] }) {
  const queryClient = useQueryClient();
  const [editCell, setEditCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [formatDialog, setFormatDialog] = useState(null);
  const [formatData, setFormatData] = useState({ bg: '#ffffff', color: '#000000', bold: false });
  const [zoom, setZoom] = useState(1);
  const [undoStack, setUndoStack] = useState([]);
  const [undoing, setUndoing] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [resizingCol, setResizingCol] = useState(null);
  const [resizingRow, setResizingRow] = useState(null);
  const [renamingCol, setRenamingCol] = useState(null);
  const [newColName, setNewColName] = useState('');
  const tableRef = useRef(null);

  const convertBookingsToData = (bookingsList) => {
    const data = bookingsList.map(b => 
      BOOKING_COLUMNS.map(col => {
        if (col.key === 'created_date' && b[col.key]) {
          return new Date(b[col.key]).toLocaleDateString('zh-TW');
        }
        return b[col.key] ?? '';
      })
    );
    return data;
  };

  const { data: sheetData, isLoading, refetch: refetchSheet } = useQuery({
    queryKey: ['customSheet', spreadsheetId, bookings],
    queryFn: async () => {
      if (isBookingSheet) {
        const data = convertBookingsToData(bookings);
        return {
          id: 'booking',
          spreadsheet_id: spreadsheetId,
          data,
          row_count: data.length,
          col_count: BOOKING_COLUMNS.length,
          col_widths: Array(BOOKING_COLUMNS.length).fill(100),
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
    mutationFn: async (updates) => {
      if (isBookingSheet) {
        // For booking sheet, directly update Booking entities
        return Promise.resolve();
      }
      return base44.entities.CustomSheet.update(sheetData.id, updates);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customSheet', spreadsheetId] }),
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, field, value }) => {
      await base44.entities.Booking.update(bookingId, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spreadsheetBookings'] });
      refetchSheet();
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId) => {
      await base44.entities.Booking.delete(bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spreadsheetBookings'] });
      refetchSheet();
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (newBooking) => {
      await base44.entities.Booking.create(newBooking);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spreadsheetBookings'] });
      refetchSheet();
    },
  });

  const changeZoom = (delta) => setZoom(z => Math.min(2, Math.max(0.4, +(z + delta).toFixed(1))));

  const recordUndo = (item) => {
    setUndoStack(prev => [...prev.slice(-49), item]);
  };

  const handleUndo = async () => {
    if (undoStack.length === 0 || undoing) return;
    setUndoing(true);
    const lastAction = undoStack[undoStack.length - 1];
    try {
      if (lastAction.type === 'edit') {
        const newData = sheetData.data.map(r => [...r]);
        newData[lastAction.row][lastAction.col] = lastAction.oldValue;
        updateMutation.mutate({ data: newData });
      }
      setUndoStack(prev => prev.slice(0, -1));
    } catch (err) {
      console.error('Undo failed:', err);
    }
    setUndoing(false);
  };

  const handleCellChange = (row, col, value) => {
    if (!sheetData) return;
    const oldValue = sheetData.data[row][col];
    if (oldValue === value) {
      setEditCell(null);
      return;
    }
    
    if (isBookingSheet && bookings[row]) {
      // Update the booking directly
      const field = BOOKING_COLUMNS[col].key;
      updateBookingMutation.mutate({
        bookingId: bookings[row].id,
        field,
        value
      });
    } else {
      // Update custom sheet data
      recordUndo({
        type: 'edit',
        row,
        col,
        oldValue,
        newValue: value
      });
      const newData = sheetData.data.map(r => [...r]);
      newData[row][col] = value;
      updateMutation.mutate({ data: newData });
    }
    setEditCell(null);
  };

  const handleCellClick = (row, col, e) => {
    if (e.shiftKey && selectedRange) {
      setSelectedRange({
        startRow: Math.min(selectedRange.startRow, row),
        startCol: Math.min(selectedRange.startCol, col),
        endRow: Math.max(selectedRange.endRow, row),
        endCol: Math.max(selectedRange.endCol, col),
      });
    } else if (!(e.ctrlKey || e.metaKey)) {
      setSelectedRange({ startRow: row, startCol: col, endRow: row, endCol: col });
    }
  };

  const isSelected = (row, col) => {
    if (!selectedRange) return false;
    return row >= selectedRange.startRow && row <= selectedRange.endRow &&
           col >= selectedRange.startCol && col <= selectedRange.endCol;
  };

  const deleteRow = (rowIdx) => {
    if (isBookingSheet && bookings[rowIdx]) {
      deleteBookingMutation.mutate(bookings[rowIdx].id);
    }
    setContextMenu(null);
  };

  const insertRowAfter = (rowIdx) => {
    if (isBookingSheet) {
      const template = bookings[rowIdx] || {};
      const newBooking = {
        client_id: template.client_id || '',
        service_type: template.service_type || '',
        scheduled_date: template.scheduled_date || '',
        time_slot: template.time_slot || '',
        status: '待確認'
      };
      createBookingMutation.mutate(newBooking);
    }
    setContextMenu(null);
  };

  const copyRow = (rowIdx) => {
    if (isBookingSheet && bookings[rowIdx]) {
      const booking = bookings[rowIdx];
      const newBooking = {
        client_id: booking.client_id,
        client_name: booking.client_name,
        service_type: booking.service_type,
        scheduled_date: booking.scheduled_date,
        time_slot: booking.time_slot,
        status: booking.status,
        address: booking.address,
        cleaner_name: booking.cleaner_name,
        notes: booking.notes
      };
      createBookingMutation.mutate(newBooking);
    }
    setContextMenu(null);
  };

  const handleColResizeStart = (e, colIdx) => {
    e.preventDefault();
    setResizingCol({ colIdx, startX: e.clientX, startWidth: sheetData.col_widths[colIdx] });
  };

  const handleRowResizeStart = (e, rowIdx) => {
    e.preventDefault();
    setResizingRow({ rowIdx, startY: e.clientY, startHeight: sheetData.row_heights[rowIdx] });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (resizingCol) {
        const delta = e.clientX - resizingCol.startX;
        const newWidth = Math.max(30, resizingCol.startWidth + delta);
        const newColWidths = [...sheetData.col_widths];
        newColWidths[resizingCol.colIdx] = newWidth;
        updateMutation.mutate({ col_widths: newColWidths });
      }
      if (resizingRow) {
        const delta = e.clientY - resizingRow.startY;
        const newHeight = Math.max(20, resizingRow.startHeight + delta);
        const newRowHeights = [...sheetData.row_heights];
        newRowHeights[resizingRow.rowIdx] = newHeight;
        updateMutation.mutate({ row_heights: newRowHeights });
      }
    };

    const handleMouseUp = () => {
      setResizingCol(null);
      setResizingRow(null);
    };

    if (resizingCol || resizingRow) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingCol, resizingRow, sheetData]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  if (isLoading || !sheetData) {
    return <div className="flex items-center justify-center h-40">載入中...</div>;
  }

  const getColLabel = (idx) => {
    let label = '';
    let n = idx;
    while (n >= 0) {
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    }
    return label;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Top toolbar */}
      <div className="px-4 py-2.5 bg-white border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-stone-700">{spreadsheetName} · {sheetData.row_count} 行 × {sheetData.col_count} 列</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleUndo} 
            disabled={undoStack.length === 0 || undoing} 
            className="gap-1 text-xs h-7 px-2 text-stone-600"
          >
            <Undo2 className="w-3 h-3" />
            復原
          </Button>
        </div>
        <div className="flex items-center gap-2 text-stone-600">
          <button onClick={() => changeZoom(-0.1)} className="px-2 py-0.5 text-sm hover:bg-stone-100 rounded">−</button>
          <span className="w-12 text-center text-sm">{Math.round(zoom * 100)}%</span>
          <button onClick={() => changeZoom(0.1)} className="px-2 py-0.5 text-sm hover:bg-stone-100 rounded">+</button>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-stone-200 rounded-lg shadow-lg py-0.5 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y, pointerEvents: 'auto' }}
          onMouseLeave={() => setContextMenu(null)}
        >
          {contextMenu.type === 'row' && (
            <>
              <button
                onClick={() => insertRowAfter(contextMenu.index)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 transition-colors text-left"
              >
                <Plus className="w-3 h-3" /> 新增下方
              </button>
              <button
                onClick={() => copyRow(contextMenu.index)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 transition-colors text-left"
              >
                <Copy className="w-3 h-3" /> 複製
              </button>
              {bookings.length > 1 && (
                <button
                  onClick={() => deleteRow(contextMenu.index)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-red-50 transition-colors border-t border-stone-100 text-left"
                >
                  <Trash2 className="w-3 h-3" /> 刪除
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto" ref={tableRef}>
        <table 
          className="border-collapse bg-white"
          style={{ 
            transformOrigin: 'top left', 
            transform: `scale(${zoom})`,
            minWidth: `${100 / zoom}%`
          }}
        >
          <thead>
            <tr>
              <th className="w-10 h-8 bg-stone-100 border border-stone-300 text-xs font-medium text-stone-600"></th>
              {sheetData.col_names.map((_, colIdx) => (
                <th
                  key={colIdx}
                  style={{ width: sheetData.col_widths[colIdx] }}
                  className="h-8 bg-stone-100 border border-stone-300 px-2 text-xs font-medium text-stone-700 select-none relative"
                >
                  <div className="flex items-center justify-between h-full">
                    <span>{getColLabel(colIdx)}</span>
                    <span className="text-[10px] text-stone-400 opacity-50">▼</span>
                  </div>
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 opacity-0 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleColResizeStart(e, colIdx)}
                    style={{ right: '-2px' }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheetData.data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td
                  className="w-10 bg-stone-100 border border-stone-300 text-xs font-medium text-stone-600 text-center select-none relative cursor-pointer hover:bg-stone-200"
                  style={{ height: sheetData.row_heights[rowIdx] }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setContextMenu({ x: rect.left, y: rect.bottom + 4, type: 'row', index: rowIdx });
                  }}
                >
                  <div className="flex items-center justify-between h-full px-2">
                    <span>{rowIdx + 1}</span>
                    <span className="text-[10px] text-stone-400 opacity-50">▼</span>
                  </div>
                  <div
                    className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-blue-400 opacity-0 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleRowResizeStart(e, rowIdx)}
                    style={{ bottom: '-2px' }}
                  />
                </td>
                {row.map((cell, colIdx) => {
                  const format = sheetData.cell_formats?.[`${rowIdx}_${colIdx}`] || {};
                  const isEditing = editCell?.row === rowIdx && editCell?.col === colIdx;
                  const selected = isSelected(rowIdx, colIdx);
                  
                  return (
                    <td
                      key={`${rowIdx}_${colIdx}`}
                      style={{
                        width: sheetData.col_widths[colIdx],
                        height: sheetData.row_heights[rowIdx],
                        backgroundColor: selected ? '#fef3c7' : (format.bg || 'white'),
                        color: format.color || 'black',
                        fontWeight: format.bold ? 'bold' : 'normal',
                        border: selected ? '2px solid #f59e0b' : '1px solid #d6d3d1'
                      }}
                      className="px-2 py-1 text-xs cursor-cell select-none"
                      onClick={(e) => {
                        handleCellClick(rowIdx, colIdx, e);
                        if (!isEditing) {
                          setEditCell({ row: rowIdx, col: colIdx });
                          setEditValue(cell);
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
                          className="h-6 p-1 text-xs border-0 shadow-none"
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
              if (e.key === 'Enter') {
                const newColNames = [...sheetData.col_names];
                newColNames[renamingCol] = newColName;
                updateMutation.mutate({ col_names: newColNames });
                setRenamingCol(null);
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingCol(null)}>取消</Button>
            <Button onClick={() => {
              const newColNames = [...sheetData.col_names];
              newColNames[renamingCol] = newColName;
              updateMutation.mutate({ col_names: newColNames });
              setRenamingCol(null);
            }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}