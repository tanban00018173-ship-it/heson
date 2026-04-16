import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Undo2, Plus, Trash2, Copy, CopyCheck, Delete, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function GoogleSheetEditor({ spreadsheetId, sheetName }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCell, setEditCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [resizingCol, setResizingCol] = useState(null);
  const [resizingRow, setResizingRow] = useState(null);
  const [draggingRow, setDraggingRow] = useState(null);
  const [dragStartRow, setDragStartRow] = useState(null);
  const [draggingCol, setDraggingCol] = useState(null);
  const [dragStartCol, setDragStartCol] = useState(null);
  const [lastClickedRow, setLastClickedRow] = useState(null);
  const [lastClickedCol, setLastClickedCol] = useState(null);
  const [colWidths, setColWidths] = useState({});
  const [rowHeights, setRowHeights] = useState({});
  const [syncing, setSyncing] = useState(false);
  const longPressTimerRef = useRef(null);

  const loadSheet = async () => {
    setLoading(true);
    try {
      const resp = await base44.functions.invoke('googleSheetsSync', {
        action: 'read',
        spreadsheetId,
        range: 'A1:Z1000'
      });
      setData(resp.data.values || []);
    } catch (err) {
      console.error('Failed to load sheet:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (spreadsheetId) loadSheet();
  }, [spreadsheetId]);

  const syncToSheets = async (newData) => {
    if (syncing) return;
    setSyncing(true);
    try {
      await base44.functions.invoke('googleSheetsSync', {
        action: 'write',
        spreadsheetId,
        range: 'A1:Z1000',
        values: newData
      });
    } catch (err) {
      console.error('Sync failed:', err);
    }
    setSyncing(false);
  };

  const handleCellChange = async (row, col, value) => {
    const newData = data.map(r => [...r]);
    newData[row][col] = value;
    setData(newData);
    await syncToSheets(newData);
    setEditCell(null);
  };

  const deleteRow = (rowIdx) => {
    const newData = data.filter((_, idx) => idx !== rowIdx);
    setData(newData);
    syncToSheets(newData);
    setContextMenu(null);
  };

  const insertRowAfter = (rowIdx) => {
    const newData = [...data];
    newData.splice(rowIdx + 1, 0, Array(data[0]?.length || 10).fill(''));
    setData(newData);
    syncToSheets(newData);
    setContextMenu(null);
  };

  const copyRow = (rowIdx) => {
    navigator.clipboard.writeText(data[rowIdx].join('\t'));
    setContextMenu(null);
  };

  const clearCol = (colIdx) => {
    const newData = data.map(row => {
      const newRow = [...row];
      newRow[colIdx] = '';
      return newRow;
    });
    setData(newData);
    syncToSheets(newData);
    setContextMenu(null);
  };

  const isSelected = (row, col) => {
    if (!selectedRange) return false;
    return row >= selectedRange.startRow && row <= selectedRange.endRow &&
           col >= selectedRange.startCol && col <= selectedRange.endCol;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (resizingCol) {
        const delta = e.clientX - resizingCol.startX;
        const newWidth = Math.max(50, resizingCol.startWidth + delta);
        setColWidths(prev => ({ ...prev, [resizingCol.colIdx]: newWidth }));
      }
      if (resizingRow) {
        const delta = e.clientY - resizingRow.startY;
        const newHeight = Math.max(30, resizingRow.startHeight + delta);
        setRowHeights(prev => ({ ...prev, [resizingRow.rowIdx]: newHeight }));
      }
    };

    const handleMouseUp = () => {
      if (draggingRow !== null && dragStartRow !== null && dragStartRow !== draggingRow) {
        const newData = [...data];
        const [movedRow] = newData.splice(dragStartRow, 1);
        newData.splice(draggingRow, 0, movedRow);
        setData(newData);
        syncToSheets(newData);
      }
      setResizingCol(null);
      setResizingRow(null);
      setDraggingRow(null);
      setDraggingCol(null);
      setDragStartRow(null);
      setDragStartCol(null);
    };

    if (resizingCol || resizingRow || draggingRow !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingCol, resizingRow, draggingRow, dragStartRow, data]);

  if (loading) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin" /></div>;
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
      <div className="px-4 py-2.5 bg-white border-b border-stone-200 flex items-center justify-between">
        <span className="text-sm font-medium text-stone-700">{sheetName} · {data.length} 行 · {data[0]?.length || 0} 列</span>
        {syncing && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
      </div>

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-white border border-stone-200 rounded-lg shadow-lg py-0.5 min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'row' && (
              <>
                <button onClick={() => insertRowAfter(contextMenu.index)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100">
                  <Plus className="w-3 h-3" /> 新增下方
                </button>
                <button onClick={() => copyRow(contextMenu.index)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100">
                  <Copy className="w-3 h-3" /> 複製
                </button>
                {data.length > 1 && (
                  <button onClick={() => deleteRow(contextMenu.index)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-red-50 border-t">
                    <Trash2 className="w-3 h-3" /> 刪除
                  </button>
                )}
              </>
            )}
            {contextMenu.type === 'col' && (
              <button onClick={() => clearCol(contextMenu.index)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100">
                <Delete className="w-3 h-3" /> 清除欄
              </button>
            )}
          </div>
        </>
      )}

      <div className="flex-1 overflow-auto">
        <table className="border-collapse bg-white">
          <thead>
            <tr>
              <th className="w-10 h-8 bg-stone-100 border border-stone-300 text-xs font-medium"></th>
              {(data[0] || []).map((_, colIdx) => (
                <th
                  key={colIdx}
                  style={{ width: colWidths[colIdx] || 100 }}
                  className={`h-8 border border-stone-300 px-2 text-xs font-medium select-none relative cursor-pointer ${
                    selectedRange?.startCol === colIdx && selectedRange?.endCol === colIdx
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                  onClick={() => {
                    setSelectedRange({ startRow: 0, startCol: colIdx, endRow: data.length - 1, endCol: colIdx });
                    setLastClickedCol(colIdx);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'col', index: colIdx });
                  }}
                >
                  <span>{getColLabel(colIdx)}</span>
                  <div
                    className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500"
                    onMouseDown={(e) => { e.stopPropagation(); setResizingCol({ colIdx, startX: e.clientX, startWidth: colWidths[colIdx] || 100 }); }}
                    style={{ right: '-3px' }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td
                  style={{ height: rowHeights[rowIdx] || 30 }}
                  className={`w-10 border border-stone-300 text-xs font-medium text-center select-none relative cursor-pointer ${
                    selectedRange?.startRow === rowIdx && selectedRange?.endRow === rowIdx
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                  onClick={() => {
                    setSelectedRange({ startRow: rowIdx, startCol: 0, endRow: rowIdx, endCol: (row || []).length - 1 });
                    setLastClickedRow(rowIdx);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'row', index: rowIdx });
                  }}
                  onMouseDown={() => {
                    longPressTimerRef.current = setTimeout(() => {
                      setDraggingRow(rowIdx);
                      setDragStartRow(rowIdx);
                    }, 500);
                  }}
                  onMouseUp={() => {
                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                  }}
                  onMouseLeave={() => {
                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                  }}
                >
                  {rowIdx + 1}
                  <div
                    className="absolute bottom-0 left-0 w-full h-2 cursor-row-resize hover:bg-blue-500"
                    onMouseDown={(e) => { e.stopPropagation(); setResizingRow({ rowIdx, startY: e.clientY, startHeight: rowHeights[rowIdx] || 30 }); }}
                    style={{ bottom: '-3px' }}
                  />
                </td>
                {row.map((cell, colIdx) => {
                  const isEditing = editCell?.row === rowIdx && editCell?.col === colIdx;
                  const selected = isSelected(rowIdx, colIdx);
                  return (
                    <td
                      key={`${rowIdx}_${colIdx}`}
                      style={{
                        width: colWidths[colIdx] || 100,
                        height: rowHeights[rowIdx] || 30,
                        backgroundColor: selected ? '#fef3c7' : 'white',
                        border: selected ? '2px solid #f59e0b' : '1px solid #d6d3d1'
                      }}
                      className="px-2 py-1 text-xs cursor-cell select-none"
                      onClick={() => {
                        if (!isEditing) {
                          setEditCell({ row: rowIdx, col: colIdx });
                          setEditValue(cell || '');
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
    </div>
  );
}