import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// 月曆排程試算表（來源）
const CALENDAR_ID = '1AgmwQLTTtslxU8Fn5GNdF9IjDAf4ih7ea5zmCUbuWWs';
// 訂單資料庫試算表（目的地）
const DB_ID = '10UDfGk4AZsC1Q_esUn2dO5PPfZ8m6ToSfeDk3mHzXG4';

// 取得試算表的所有工作表資訊（含 sheetId）
async function getSpreadsheetSheets(accessToken, spreadsheetId) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`無法取得試算表資訊`);
  const data = await res.json();
  return data.sheets.map(s => ({ title: s.properties.title, sheetId: s.properties.sheetId }));
}

// 讀取工作表資料（用 sheetId 方式存取）
async function readSheetById(accessToken, spreadsheetId, sheetId, sheetTitle) {
  // 用 sheetId 方式讀取需要用 spreadsheets.get，較複雜
  // 改用 title + 直接 values API（讀取通常不會有斜線問題，只有寫入有問題）
  const encodedRange = encodeURIComponent(`${sheetTitle}!A1:Z2000`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`讀取失敗: ${err.error?.message}`);
  }
  const data = await res.json();
  return data.values || [];
}

// 用 sheetId 清除資料（使用 batchUpdate + deleteRange）
async function clearSheetById(accessToken, sheetId) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          updateCells: {
            range: {
              sheetId,
              startRowIndex: 1, // 從第 2 列開始（0-indexed）
              startColumnIndex: 0,
              endColumnIndex: 26,
            },
            fields: 'userEnteredValue',
          }
        }]
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`清除失敗: ${err.error?.message}`);
  }
}

// 用 sheetId 寫入資料（使用 batchUpdate + updateCells）
async function writeRowsById(accessToken, sheetId, startRow, rows) {
  // 把 rows 轉換成 CellData 格式
  const rowData = rows.map(row => ({
    values: row.map(cell => ({
      userEnteredValue: { stringValue: String(cell || '') }
    }))
  }));

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          updateCells: {
            range: {
              sheetId,
              startRowIndex: startRow - 1, // 0-indexed（startRow=2 → index=1）
              startColumnIndex: 0,
            },
            rows: rowData,
            fields: 'userEnteredValue',
          }
        }]
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`寫入失敗: ${err.error?.message}`);
  }
  return await res.json();
}

// 取得某工作表目前的最大流水號
async function getNextIndex(accessToken, sheetId, sheetTitle, prefix) {
  const rows = await readSheetById(accessToken, DB_ID, sheetId, sheetTitle);
  let max = 0;
  for (const row of rows.slice(1)) {
    const cell = (row[0] || '').toString();
    if (cell.startsWith(prefix)) {
      const num = parseInt(cell.slice(prefix.length), 10);
      if (!isNaN(num) && num > max) max = num;
    }
  }
  return max + 1;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'preview';

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 取得訂單資料庫所有工作表（含 sheetId）
    const dbSheets = await getSpreadsheetSheets(accessToken, DB_ID);
    const dbSheetMap = {}; // title → sheetId
    for (const s of dbSheets) dbSheetMap[s.title] = s.sheetId;

    // --- mode: clear_all ---
    if (mode === 'clear_all') {
      const skip = ['表單回應 1'];
      const cleared = [];
      for (const s of dbSheets) {
        if (skip.includes(s.title)) continue;
        await clearSheetById(accessToken, s.sheetId);
        cleared.push(s.title);
        console.log(`已清除 ${s.title}`);
      }
      return Response.json({ success: true, cleared });
    }

    // 取得月曆來源工作表資料
    const SOURCE_SHEET = '4月排序（26_4/10-5/9）';
    const calRows = await readSheetById(accessToken, CALENDAR_ID, null, SOURCE_SHEET);
    if (calRows.length < 2) {
      return Response.json({ error: `"${SOURCE_SHEET}" 沒有資料` }, { status: 400 });
    }

    const calHeaders = calRows[0].map(h => (h || '').trim());

    const _idxName = calHeaders.indexOf('姓名');
    const _idxTime = calHeaders.indexOf('清掃時間');
    const dataRows = calRows.slice(1).filter(r => {
      if (!r || !r.some(c => c)) return false;
      const hasName = _idxName >= 0 ? !!(r[_idxName] || '').trim() : true;
      const hasTime = _idxTime >= 0 ? !!(r[_idxTime] || '').trim() : true;
      return hasName && hasTime;
    });

    console.log('DB工作表:', JSON.stringify(Object.keys(dbSheetMap)));
    console.log('月曆欄位:', calHeaders.join(' | '));
    console.log(`共 ${dataRows.length} 列資料`);

    // --- mode: preview ---
    if (mode === 'preview') {
      return Response.json({
        mode: 'preview',
        source_sheet: SOURCE_SHEET,
        headers: calHeaders,
        sample_rows: dataRows.slice(0, 5),
        total_rows: dataRows.length,
        db_sheets: dbSheets.map(s => ({ title: s.title, sheetId: s.sheetId, chars: [...s.title].map(c => c.charCodeAt(0).toString(16)) })),
      });
    }

    // --- mode: migrate ---
    const idxTime    = calHeaders.indexOf('清掃時間');
    const idxName    = calHeaders.indexOf('姓名');
    const idxAddress = calHeaders.indexOf('需要服務地址');
    const idxMapsUrl = calHeaders.indexOf('地址連結');
    const idxPlan    = calHeaders.findIndex(h => h.includes('時長') || h.includes('訂閱'));

    console.log(`欄位對應 → 時間:${idxTime} 姓名:${idxName} 地址:${idxAddress} 地址連結:${idxMapsUrl} 方案:${idxPlan}`);

    // 用工作表前綴字母找出實際工作表 title（避免斜線字元不一致）
    function findSheetByPrefix(prefix) {
      return dbSheets.find(s => s.title.startsWith(prefix));
    }

    function resolveTargetSheetObj(plan, name) {
      const p = (plan || '').toLowerCase();
      const n = (name || '').toLowerCase();
      if (p.includes('民宿') || p.includes('旅宿') || p.includes('退租') || n.includes('民宿') || n.includes('旅宿')) {
        return findSheetByPrefix('H');
      }
      if (p.includes('毛坯') || p.includes('裝潢後') || p.includes('新成屋')) {
        return findSheetByPrefix('P');
      }
      if (p.includes('大掃除') || p.includes('細清') || p.includes('深層') || p.includes('精緻')) {
        return findSheetByPrefix('D');
      }
      if (p.includes('每月') || p.includes('月') || p.includes('訂閱') || p.includes('次')) {
        return findSheetByPrefix('R');
      }
      return findSheetByPrefix('L');
    }

    // 分組（key: sheetId）
    const grouped = {}; // sheetId → { sheetObj, rows[] }
    for (const row of dataRows) {
      const plan   = idxPlan >= 0 ? (row[idxPlan] || '') : '';
      const name   = idxName >= 0 ? (row[idxName] || '') : '';
      const sheetObj = resolveTargetSheetObj(plan, name);
      if (!sheetObj) continue;
      const key = sheetObj.sheetId;
      if (!grouped[key]) grouped[key] = { sheetObj, rows: [] };
      grouped[key].rows.push(row);
    }

    // 先清除目標工作表
    for (const { sheetObj } of Object.values(grouped)) {
      await clearSheetById(accessToken, sheetObj.sheetId);
      console.log(`已清除 ${sheetObj.title}`);
    }

    const allResults = [];

    for (const { sheetObj, rows } of Object.values(grouped)) {
      const prefix = sheetObj.title.charAt(0);
      const outputRows = [];
      let nextIdx = 1;

      for (const row of rows) {
        const timeStr = idxTime    >= 0 ? (row[idxTime]    || '') : '';
        const name    = idxName    >= 0 ? (row[idxName]    || '') : '';
        const address = idxAddress >= 0 ? (row[idxAddress] || '') : '';
        const mapsUrl = idxMapsUrl >= 0 ? (row[idxMapsUrl] || '') : '';
        const plan    = idxPlan    >= 0 ? (row[idxPlan]    || '') : '';

        const dbId = `${prefix}${nextIdx}`;
        outputRows.push([dbId, timeStr, name, '', address, mapsUrl, plan]);
        nextIdx++;
      }

      await writeRowsById(accessToken, sheetObj.sheetId, 2, outputRows);
      allResults.push({ sheet: sheetObj.title, inserted: outputRows.length });
      console.log(`${sheetObj.title}: 寫入 ${outputRows.length} 列`);
    }

    return Response.json({ success: true, source: SOURCE_SHEET, results: allResults });

  } catch (error) {
    console.error('migrateCalendarToDb error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});