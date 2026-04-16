import React, { useState, useRef, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Plus, Type, Undo2, ChevronDown } from "lucide-react";
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
  const [renamingRow, setRenamingRow] = useState(null);
  const [newRowName, setNewRowName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rowNames, setRowNames] = useState({});
  const [undoStack, setUndoStack] = useState([]);
  const [undoing, setUndoing] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null); // { startRow, startCol, endRow, endCol }
  const [resizingCol, setResizingCol] = useState(null); // { colIdx, startX, startWidth }
  const [resizingRow, setResizingRow] = useState(null); // { rowIdx, startY, startHeight }
  const [selectedCol, setSelectedCol] = useState(null); // Currently selected column index
  const [selectedRow, setSelectedRow] = useState(null); // Currently selected row index
  const [pendingEdit, setPendingEdit] = useState(null); // { row, col, newValue }
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

  const recordUndo = (item) => {
    setUndoStack(prev => [...prev.slice(-49), item]); // Keep last 50 items
  };

  const handleUndo = async () => {
    if (undoStack.length === 0 || undoing) return;
    setUndoing(true);
    const lastAction = undoStack[undoStack.length - 1];
    try {
      if (lastAction.type === 'insertCol') {
        await deleteColData(lastAction.colIdx);
      } else if (lastAction.type === 'deleteCol') {
        await restoreColData(lastAction.colIdx, lastAction.data);
      } else if (lastAction.type === 'insertRow') {
        await deleteRowData(lastAction.rowIdx);
      } else if (lastAction.type === 'deleteRow') {
        await restoreRowData(lastAction.rowIdx, lastAction.data);
      } else if (lastAction.type === 'copyCol') {
        await deleteColData(lastAction.colIdx + 1);
      } else if (lastAction.type === 'copyRow') {
        await deleteRowData(lastAction.rowIdx + 1);
      } else if (lastAction.type === 'renameCol') {
        await updateColName(lastAction.colIdx, lastAction.oldName);
      } else if (lastAction.type === 'renameRow') {
        setRowNames(prev => {
          const newNames = { ...prev };
          if (lastAction.oldName) {
            newNames[lastAction.rowIdx] = lastAction.oldName;
          } else {
            delete newNames[lastAction.rowIdx];
          }
          return newNames;
        });
      } else if (lastAction.type === 'formatCell') {
        await updateCellFormat(lastAction.key, lastAction.oldFormat);
      }
      setUndoStack(prev => prev.slice(0, -1));
    } catch (err) {
      console.error('Undo failed:', err);
    }
    setUndoing(false);
  };

  const deleteColData = (colIdx) => {
    if (!sheetData) return;
    const newData = sheetData.data.map(row => {
      const newRow = [...row];
      newRow.splice(colIdx, 1);
      return newRow;
    });
    const newColWidths = [...sheetData.col_widths];
    newColWidths.splice(colIdx, 1);
    const newColNames = [...sheetData.col_names];
    newColNames.splice(colIdx, 1);
    return updateMutation.mutate({
      data: newData,
      col_widths: newColWidths,
      col_names: newColNames,
      col_count: sheetData.col_count - 1
    });
  };

  const restoreColData = (colIdx, data) => {
    if (!sheetData) return;
    const newData = sheetData.data.map((row, rowIdx) => {
      const newRow = [...row];
      newRow.splice(colIdx, 0, data[rowIdx] || '');
      return newRow;
    });
    const newColWidths = [...sheetData.col_widths];
    newColWidths.splice(colIdx, 0, 100);
    const newColNames = [...sheetData.col_names];
    newColNames.splice(colIdx, 0, String.fromCharCode(65 + (colIdx % 26)));
    return updateMutation.mutate({
      data: newData,
      col_widths: newColWidths,
      col_names: newColNames,
      col_count: sheetData.col_count + 1
    });
  };

  const deleteRowData = (rowIdx) => {
    if (!sheetData) return;
    const newData = [...sheetData.data];
    newData.splice(rowIdx, 1);
    const newRowHeights = [...sheetData.row_heights];
    newRowHeights.splice(rowIdx, 1);
    return updateMutation.mutate({
      data: newData,
      row_heights: newRowHeights,
      row_count: sheetData.row_count - 1
    });
  };

  const restoreRowData = (rowIdx, data) => {
    if (!sheetData) return;
    const newData = [...sheetData.data];
    newData.splice(rowIdx, 0, data);
    const newRowHeights = [...sheetData.row_heights];
    newRowHeights.splice(rowIdx, 0, 30);
    return updateMutation.mutate({
      data: newData,
      row_heights: newRowHeights,
      row_count: sheetData.row_count + 1
    });
  };

  const updateColName = (colIdx, newName) => {
    if (!sheetData) return;
    const newColNames = [...sheetData.col_names];
    newColNames[colIdx] = newName;
    return updateMutation.mutate({ col_names: newColNames });
  };

  const updateCellFormat = (key, format) => {
    if (!sheetData) return;
    const newFormats = { ...sheetData.cell_formats };
    if (format) {
      newFormats[key] = format;
    } else {
      delete newFormats[key];
    }
    return updateMutation.mutate({ cell_formats: newFormats });
  };

  const handleCellChange = (row, col, value) => {
    if (!sheetData) return;
    const oldValue = sheetData.data[row][col];
    if (oldValue === value) {
      setEditCell(null);
      return;
    }
    // Show confirmation dialog for data changes
    setPendingEdit({ row, col, newValue: value, oldValue });
  };

  const confirmCellChange = async () => {
    if (!pendingEdit || !sheetData) return;
    
    try {
      if (isBookingSheet && bookings.length > 0) {
        // For booking sheet, update the Booking entity directly
        const bookingIdx = pendingEdit.row - 1; // Row 0 is header
        if (bookingIdx >= 0 && bookingIdx < bookings.length) {
          const booking = bookings[bookingIdx];
          const columnKey = BOOKING_COLUMNS[pendingEdit.col]?.key;
          if (columnKey && columnKey !== 'created_date') {
            await base44.entities.Booking.update(booking.id, {
              [columnKey]: pendingEdit.newValue
            });
          }
        }
      } else {
        // For custom sheets, update the CustomSheet data
        const newData = sheetData.data.map(r => [...r]);
        newData[pendingEdit.row][pendingEdit.col] = pendingEdit.newValue;
        await updateMutation.mutateAsync({ data: newData });
      }
      
      setEditCell(null);
      setPendingEdit(null);
    } catch (err) {
      console.error('Failed to confirm change:', err);
    }
  };

  const handleCellClick = (row, col, e) => {
    if (e.shiftKey && selectedRange) {
      // Extend selection
      setSelectedRange({
        startRow: Math.min(selectedRange.startRow, row),
        startCol: Math.min(selectedRange.startCol, col),
        endRow: Math.max(selectedRange.endRow, row),
        endCol: Math.max(selectedRange.endCol, col),
      });
    } else if (e.ctrlKey || e.metaKey) {
      // Keep current selection
    } else {
      // Single cell selection
      setSelectedRange({ startRow: row, startCol: col, endRow: row, endCol: col });
    }
  };

  const isSelected = (row, col) => {
    if (!selectedRange) return false;
    return row >= selectedRange.startRow && row <= selectedRange.endRow &&
           col >= selectedRange.startCol && col <= selectedRange.endCol;
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
    recordUndo({ type: 'insertCol', colIdx: beforeCol, description: `新增欄位於第 ${beforeCol + 1} 欄` });
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
    const deletedData = sheetData.data.map(row => row[colIdx]);
    const newData = sheetData.data.map(row => {
      const newRow = [...row];
      newRow.splice(colIdx, 1);
      return newRow;
    });
    const newColWidths = [...sheetData.col_widths];
    newColWidths.splice(colIdx, 1);
    const newColNames = [...sheetData.col_names];
    newColNames.splice(colIdx, 1);
    recordUndo({ type: 'deleteCol', colIdx, data: deletedData, description: `刪除第 ${colIdx + 1} 欄` });
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
    recordUndo({ type: 'copyCol', colIdx, description: `複製第 ${colIdx + 1} 欄` });
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
    recordUndo({ type: 'insertRow', rowIdx: beforeRow, description: `新增列於第 ${beforeRow + 1} 列` });
    updateMutation.mutate({
      data: newData,
      row_heights: newRowHeights,
      row_count: sheetData.row_count + 1
    });
    setContextMenu(null);
  };

  const deleteRow = (rowIdx) => {
    if (!sheetData || sheetData.row_count <= 1) return;
    const deletedData = [...sheetData.data[rowIdx]];
    const newData = [...sheetData.data];
    newData.splice(rowIdx, 1);
    const newRowHeights = [...sheetData.row_heights];
    newRowHeights.splice(rowIdx, 1);
    recordUndo({ type: 'deleteRow', rowIdx, data: deletedData, description: `刪除第 ${rowIdx + 1} 列` });
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
    recordUndo({ type: 'copyRow', rowIdx, description: `複製第 ${rowIdx + 1} 列` });
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
    const oldFormat = sheetData.cell_formats?.[key];
    const newFormats = { ...sheetData.cell_formats, [key]: formatData };
    recordUndo({ type: 'formatCell', key, oldFormat, description: `變更 ${key} 單元格格式` });
    updateMutation.mutate({ cell_formats: newFormats });
    setFormatDialog(null);
  };

  const renameCol = (colIdx) => {
    if (!sheetData || !newColName.trim()) return;
    const newColNames = [...sheetData.col_names];
    const oldName = newColNames[colIdx];
    newColNames[colIdx] = newColName;
    recordUndo({ type: 'renameCol', colIdx, oldName, description: `重新命名第 ${colIdx + 1} 欄` });
    updateMutation.mutate({ col_names: newColNames });
    setRenamingCol(null);
    setNewColName('');
    setContextMenu(null);
  };

  const renameRow = (rowIdx) => {
    if (!sheetData || !newRowName.trim()) return;
    const oldName = rowNames[rowIdx];
    recordUndo({ type: 'renameRow', rowIdx, oldName, description: `重新命名第 ${rowIdx + 1} 列` });
    setRowNames({ ...rowNames, [rowIdx]: newRowName });
    setRenamingRow(null);
    setNewRowName('');
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
      {/* Info bar with search, undo, and zoom */}
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
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={undoStack.length === 0 || undoing}
          className="gap-1 text-xs px-2 h-6"
          title={undoStack.length > 0 ? `復原: ${undoStack[undoStack.length - 1]?.description}` : '沒有可復原的操作'}
        >
          <Undo2 className="w-3 h-3" />
          復原
          {undoStack.length > 0 && (
            <Badge className="ml-1 h-4 px-1 text-[10px] bg-amber-100 text-amber-700">{undoStack.length}</Badge>
          )}
        </Button>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => changeZoom(-0.1)} className="p-1 hover:bg-stone-200 text-stone-600">−</button>
          <span className="w-10 text-center text-xs text-stone-600">{Math.round(zoom * 100)}%</span>
          <button onClick={() => changeZoom(0.1)} className="p-1 hover:bg-stone-200 text-stone-600">+</button>
        </div>
      </div>

      {/* Table */}
      <div ref={tableRef} className="flex-1 overflow-auto bg-white">
        <table className="border-collapse bg-white" style={{ transformOrigin: 'top left', transform: `scale(${zoom})`, width: `${100 / zoom}%` }}>
          <thead>
            <tr className="bg-stone-50">
              <th className="w-9 h-8 bg-stone-100 border border-stone-200 text-xs text-stone-600 text-center font-medium"></th>
              {sheetData.col_names.map((name, colIdx) => (
               <th
                 key={colIdx}
                 style={{ width: sheetData.col_widths[colIdx] }}
                 className={`h-8 bg-stone-50 border border-stone-200 px-2 text-xs font-semibold cursor-pointer hover:bg-stone-100 relative group select-none ${selectedCol === colIdx ? 'bg-yellow-100 border-yellow-400' : 'text-stone-700'}`}
                 onClick={(e) => {
                   e.stopPropagation();
                   if (selectedCol === colIdx) {
                     // Second click: show context menu
                     const rect = e.currentTarget.getBoundingClientRect();
                     setContextMenu({ x: rect.left, y: rect.bottom + 4, type: 'col', index: colIdx });
                   } else {
                     // First click: select column
                     setSelectedCol(colIdx);
                     setSelectedRow(null);
                     setContextMenu(null);
                   }
                 }}
               >
                  <div className="flex items-center justify-between h-full">
                    <span className="truncate">{String.fromCharCode(65 + colIdx)}</span>
                    <ChevronDown className="w-3 h-3 text-stone-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                  </div>
                  <div
                    className="absolute top-0 right-0 w-0.5 h-full cursor-col-resize hover:bg-blue-400 opacity-0 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleColResizeStart(e, colIdx)}
                    style={{ right: '-1px' }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-blue-50">
                <td
                  className={`w-9 bg-stone-50 border border-stone-200 text-xs text-stone-600 text-center font-medium cursor-pointer hover:bg-stone-100 relative group select-none ${selectedRow === rowIdx ? 'bg-yellow-100 border-yellow-400' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedRow === rowIdx) {
                      // Second click: show context menu
                      const rect = e.currentTarget.getBoundingClientRect();
                      setContextMenu({ x: rect.left, y: rect.bottom + 4, type: 'row', index: rowIdx });
                    } else {
                      // First click: select row
                      setSelectedRow(rowIdx);
                      setSelectedCol(null);
                      setContextMenu(null);
                    }
                  }}
                  title={rowNames[rowIdx] ? `${rowIdx + 1} - ${rowNames[rowIdx]}` : `第 ${rowIdx + 1} 列`}
                  style={{ height: sheetData.row_heights[rowIdx] }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span>{rowIdx + 1}</span>
                  </div>
                  <div
                    className="absolute bottom-0 left-0 w-full h-0.5 cursor-row-resize hover:bg-blue-400 opacity-0 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleRowResizeStart(e, rowIdx)}
                    style={{ bottom: '-1px' }}
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
                        backgroundColor: selected ? '#fef08a' : (format.bg || 'white'),
                        color: format.color || 'black',
                        fontWeight: format.bold ? 'bold' : 'normal',
                        border: selected ? '2px solid #eab308' : '1px solid #e5e7eb'
                      }}
                      className="px-2 py-1 text-xs cursor-cell select-none"
                      onClick={(e) => {
                        handleCellClick(rowIdx, colIdx, e);
                        setEditCell({ row: rowIdx, col: colIdx });
                        setEditValue(cell);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, type: 'cell', row: rowIdx, col: colIdx });
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

      {/* Context menus */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => {
            setContextMenu(null);
            setSelectedCol(null);
            setSelectedRow(null);
          }} />
          <div
            className="fixed z-50 bg-white border border-stone-200 rounded-lg shadow-lg py-0.5 min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.type === 'col' && (
              <>
                <button
                  onClick={() => insertCol(contextMenu.index)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <Plus className="w-3 h-3" /> 新增左欄
                </button>
                <button
                  onClick={() => insertCol(contextMenu.index + 1)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <Plus className="w-3 h-3" /> 新增右欄
                </button>
                <button
                  onClick={() => copyCol(contextMenu.index)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <Copy className="w-3 h-3" /> 複製
                </button>
                <button
                  onClick={() => {
                    setRenamingCol(contextMenu.index);
                    setNewColName(sheetData.col_names[contextMenu.index] || '');
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <Type className="w-3 h-3" /> 重新命名
                </button>
                {sheetData.col_count > 1 && (
                  <button
                    onClick={() => deleteCol(contextMenu.index)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-red-50 transition-colors border-t border-stone-100"
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
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <Plus className="w-3 h-3" /> 新增上方
                </button>
                <button
                  onClick={() => insertRow(contextMenu.index + 1)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <Plus className="w-3 h-3" /> 新增下方
                </button>
                <button
                  onClick={() => copyRow(contextMenu.index)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <Copy className="w-3 h-3" /> 複製
                </button>
                <button
                  onClick={() => {
                    setRenamingRow(contextMenu.index);
                    setNewRowName(rowNames[contextMenu.index] || '');
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <Type className="w-3 h-3" /> 重新命名
                </button>
                {sheetData.row_count > 1 && (
                  <button
                    onClick={() => deleteRow(contextMenu.index)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-red-50 transition-colors border-t border-stone-100"
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
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <Type className="w-3 h-3" /> 設定格式
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

      {/* Rename row dialog */}
      <Dialog open={renamingRow !== null} onOpenChange={() => setRenamingRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重新命名列</DialogTitle>
          </DialogHeader>
          <Input
            value={newRowName}
            onChange={(e) => setNewRowName(e.target.value)}
            placeholder="輸入新名稱..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') renameRow(renamingRow);
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingRow(null)}>取消</Button>
            <Button onClick={() => renameRow(renamingRow)}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm cell change dialog */}
      <Dialog open={!!pendingEdit} onOpenChange={() => setPendingEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認修改客戶資料</DialogTitle>
          </DialogHeader>
          {pendingEdit && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-stone-500 mb-1">位置：第 {pendingEdit.row + 1} 列、第 {String.fromCharCode(65 + pendingEdit.col)} 欄</p>
              </div>
              <div className="bg-stone-50 p-3 rounded-lg space-y-2">
                <div>
                  <p className="text-xs text-stone-500">原值</p>
                  <p className="text-sm font-medium text-stone-700">{pendingEdit.oldValue || '（空）'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">新值</p>
                  <p className="text-sm font-medium text-amber-700">{pendingEdit.newValue || '（空）'}</p>
                </div>
              </div>
              <p className="text-xs text-red-600">⚠️ 此修改將覆蓋客戶原始資料，請確認無誤。</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingEdit(null)}>取消</Button>
            <Button onClick={confirmCellChange} className="bg-amber-600 hover:bg-amber-700">確認修改</Button>
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