/**
 * patchSheetRow — 增量更新試算表指定列
 *
 * 設計原則：
 * - 用 sheet_db_id（如 R5）或 address 快速定位列，不掃全表
 * - 讀取工作表標題行，動態識別欄位位置
 * - 只寫入傳入的欄位，不影響其他欄位
 * - 可任意組合欄位，新增欄位後不需改程式邏輯
 *
 * Payload:
 * {
 *   sheet_db_id: "R5",           // 優先用編號定位
 *   address: "台北市...",         // 備選：用地址定位
 *   sheet_name: "R／定清案件",    // 可選：指定工作表（否則自動掃描所有表）
 *   fields: {                    // 要更新的欄位（key 需與表頭對應）
 *     "清掃時間": "4/15 09:00-13:00",
 *     "方案/費用": "4hr×4次 NT$6000",
 *     "備註": "有寵物",
 *   }
 * }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DB_ID = '10UDfGk4AZsC1Q_esUn2dO5PPfZ8m6ToSfeDk3mHzXG4';

// 取得試算表所有工作表
async function getSheets(accessToken) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error('無法取得工作表列表');
  const data = await res.json();
  return data.sheets.map(s => ({ title: s.properties.title, sheetId: s.properties.sheetId }));
}

// 讀取工作表標題列（第1列）→ 回傳 { 欄位名稱: 欄索引（0-based）}
async function getHeaderMap(accessToken, sheetTitle) {
  const range = encodeURIComponent(`${sheetTitle}!A1:Z1`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`無法讀取標題: ${sheetTitle}`);
  const data = await res.json();
  const headers = data.values?.[0] || [];
  const map = {};
  headers.forEach((h, i) => { if (h) map[h.trim()] = i; });
  return { map, totalCols: headers.length };
}

// 在工作表 A 欄搜尋 sheet_db_id，回傳列號（1-based，含標題）
async function findRowByDbId(accessToken, sheetTitle, dbId) {
  const range = encodeURIComponent(`${sheetTitle}!A2:A2000`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const rows = data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if ((rows[i][0] || '').trim() === dbId.trim()) {
      return i + 2; // 1-based，+1 for header, +1 for 0-index
    }
  }
  return null;
}

// 在工作表搜尋地址欄位，回傳列號（1-based）
async function findRowByAddress(accessToken, sheetTitle, address, headerMap) {
  const addrColIdx = Object.entries(headerMap).find(([k]) =>
    k.includes('地址') && !k.includes('連結') && !k.includes('URL')
  )?.[1];
  if (addrColIdx === undefined) return null;

  const colLetter = String.fromCharCode(65 + addrColIdx);
  const range = encodeURIComponent(`${sheetTitle}!${colLetter}2:${colLetter}2000`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const rows = data.values || [];
  const normalizedTarget = address.replace(/\s+/g, '');
  for (let i = 0; i < rows.length; i++) {
    const cell = (rows[i][0] || '').replace(/\s+/g, '');
    if (cell === normalizedTarget || cell.includes(normalizedTarget)) {
      return i + 2;
    }
  }
  return null;
}

// 模糊匹配欄位名稱：fields 的 key 不需要完全等於標題，只要包含即可
function resolveFieldToColIndex(headerMap, fieldKey) {
  // 完全匹配優先
  if (headerMap[fieldKey] !== undefined) return headerMap[fieldKey];
  // 模糊匹配：標題包含 fieldKey 或 fieldKey 包含標題
  for (const [header, idx] of Object.entries(headerMap)) {
    if (header.includes(fieldKey) || fieldKey.includes(header)) return idx;
  }
  return null;
}

// 轉換欄索引（0-based）為 A1 欄位字母
function colLetter(idx) {
  // 支援 A-Z, AA-AZ...
  let result = '';
  let n = idx + 1;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { sheet_db_id, address, sheet_name, fields } = body;

    if (!fields || Object.keys(fields).length === 0) {
      return Response.json({ error: '請提供 fields 欄位更新資料' }, { status: 400 });
    }
    if (!sheet_db_id && !address) {
      return Response.json({ error: '請提供 sheet_db_id 或 address 以定位列' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
    const allSheets = await getSheets(accessToken);

    // 決定要搜尋哪些工作表
    let targetSheets = allSheets.filter(s => s.title.includes('／') || s.title.includes('/'));
    if (sheet_name) {
      targetSheets = targetSheets.filter(s => s.title === sheet_name);
      if (targetSheets.length === 0) {
        return Response.json({ error: `找不到工作表: ${sheet_name}` }, { status: 404 });
      }
    }

    // 用 sheet_db_id 前綴快速縮小範圍（只搜尋對應字母的工作表）
    if (sheet_db_id) {
      const prefix = sheet_db_id.charAt(0).toUpperCase();
      const prefixMatch = targetSheets.filter(s => s.title.charAt(0) === prefix);
      if (prefixMatch.length > 0) targetSheets = prefixMatch;
    }

    // 在目標工作表中找到對應列
    let foundSheet = null;
    let foundRowNum = null;
    let foundHeaderMap = null;

    for (const sheet of targetSheets) {
      const { map } = await getHeaderMap(accessToken, sheet.title);

      let rowNum = null;
      if (sheet_db_id) {
        rowNum = await findRowByDbId(accessToken, sheet.title, sheet_db_id);
      }
      if (!rowNum && address) {
        rowNum = await findRowByAddress(accessToken, sheet.title, address, map);
      }

      if (rowNum) {
        foundSheet = sheet;
        foundRowNum = rowNum;
        foundHeaderMap = map;
        break;
      }
    }

    if (!foundSheet || !foundRowNum) {
      return Response.json({
        error: '找不到對應列',
        searched: targetSheets.map(s => s.title),
        lookup: { sheet_db_id, address }
      }, { status: 404 });
    }

    // 組裝 batchUpdate requests — 每個欄位一個 ValueRange
    const data = [];
    const unmatched = [];

    for (const [fieldKey, value] of Object.entries(fields)) {
      const colIdx = resolveFieldToColIndex(foundHeaderMap, fieldKey);
      if (colIdx === null) {
        unmatched.push(fieldKey);
        continue;
      }
      const cell = `${foundSheet.title}!${colLetter(colIdx)}${foundRowNum}`;
      data.push({
        range: encodeURIComponent(cell),
        values: [[value ?? '']]
      });
    }

    if (data.length === 0) {
      return Response.json({
        error: '沒有可匹配的欄位',
        unmatched,
        available_headers: Object.keys(foundHeaderMap)
      }, { status: 400 });
    }

    // 批次更新（每個欄位單獨更新，避免影響其他欄位）
    const updateResults = [];
    for (const item of data) {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}/values/${item.range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ range: decodeURIComponent(item.range), values: item.values }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        console.warn(`更新 ${item.range} 失敗: ${err.error?.message}`);
        updateResults.push({ range: item.range, success: false, error: err.error?.message });
      } else {
        updateResults.push({ range: item.range, success: true });
      }
    }

    console.log(`patchSheetRow: ${foundSheet.title} 第${foundRowNum}列，更新 ${data.length} 欄`);

    return Response.json({
      success: true,
      sheet: foundSheet.title,
      row: foundRowNum,
      updated: updateResults,
      unmatched_fields: unmatched,
    });

  } catch (error) {
    console.error('patchSheetRow error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});