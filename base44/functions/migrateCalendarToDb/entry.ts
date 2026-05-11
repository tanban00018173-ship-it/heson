import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// 月曆排程試算表（來源）
const CALENDAR_ID = '1AgmwQLTTtslxU8Fn5GNdF9IjDAf4ih7ea5zmCUbuWWs';
// 訂單資料庫試算表（目的地）
const DB_ID = '10UDfGk4AZsC1Q_esUn2dO5PPfZ8m6ToSfeDk3mHzXG4';

// 取得試算表的所有工作表資訊
async function getSpreadsheetSheets(accessToken, spreadsheetId) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`無法取得試算表資訊: ${err.error?.message}`);
  }
  const data = await res.json();
  return data.sheets.map(s => ({ title: s.properties.title, sheetId: s.properties.sheetId }));
}

// 讀取工作表資料（values API，用 title encode）
async function readSheet(accessToken, spreadsheetId, sheetTitle) {
  const range = encodeURIComponent(`${sheetTitle}!A1:Z2000`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`讀取失敗 "${sheetTitle}": ${err.error?.message}`);
  }
  const data = await res.json();
  return data.values || [];
}

// 清除工作表資料（values.clear API，從第2列開始）
async function clearSheet(accessToken, sheetTitle) {
  const range = encodeURIComponent(`${sheetTitle}!A2:Z2000`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}/values/${range}:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`清除失敗 "${sheetTitle}": ${err.error?.message}`);
  }
  return await res.json();
}

// 寫入資料（values.update API，PUT，從第2列開始）
async function writeRows(accessToken, sheetTitle, rows) {
  if (!rows || rows.length === 0) return;
  const endRow = rows.length + 1; // +1 for header row offset
  const endCol = String.fromCharCode(65 + rows[0].length - 1); // A=65
  const range = encodeURIComponent(`${sheetTitle}!A2:${endCol}${endRow}`);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`寫入失敗 "${sheetTitle}": ${err.error?.message}`);
  }
  return await res.json();
}

// 用前綴字母找工作表
function findSheetByPrefix(dbSheets, prefix) {
  return dbSheets.find(s => s.title.startsWith(prefix));
}

// 根據方案/姓名決定目標工作表
function resolveTargetSheet(dbSheets, plan, name) {
  const p = (plan || '');
  const n = (name || '');
  if (p.includes('民宿') || p.includes('旅宿') || p.includes('退租') || n.includes('民宿') || n.includes('旅宿')) {
    return findSheetByPrefix(dbSheets, 'H');
  }
  if (p.includes('毛坯') || p.includes('裝潢後') || p.includes('新成屋')) {
    return findSheetByPrefix(dbSheets, 'P');
  }
  if (p.includes('大掃除') || p.includes('細清') || p.includes('深層') || p.includes('精緻')) {
    return findSheetByPrefix(dbSheets, 'D');
  }
  if (p.includes('每月') || p.includes('月') || p.includes('訂閱') || p.includes('次')) {
    return findSheetByPrefix(dbSheets, 'R');
  }
  return findSheetByPrefix(dbSheets, 'L');
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

    // 取得訂單資料庫所有工作表
    const dbSheets = await getSpreadsheetSheets(accessToken, DB_ID);
    console.log('DB工作表:', JSON.stringify(dbSheets.map(s => s.title)));

    // --- mode: clear_all ---
    if (mode === 'clear_all') {
      const skip = ['表單回應 1'];
      const cleared = [];
      for (const s of dbSheets) {
        if (skip.includes(s.title)) continue;
        await clearSheet(accessToken, s.title);
        cleared.push(s.title);
        console.log(`已清除 ${s.title}`);
      }
      return Response.json({ success: true, cleared });
    }

    // 讀取月曆來源工作表
    const SOURCE_SHEET = '4月排序（26_4/10-5/9）';
    const calRows = await readSheet(accessToken, CALENDAR_ID, SOURCE_SHEET);
    if (calRows.length < 2) {
      return Response.json({ error: `"${SOURCE_SHEET}" 沒有資料` }, { status: 400 });
    }

    const calHeaders = calRows[0].map(h => (h || '').trim());
    console.log('月曆欄位:', calHeaders.join(' | '));

    const idxTime    = calHeaders.indexOf('清掃時間');
    const idxName    = calHeaders.indexOf('姓名');
    const idxAddress = calHeaders.indexOf('需要服務地址');
    const idxMapsUrl = calHeaders.indexOf('地址連結');
    const idxPlan    = calHeaders.findIndex(h => h.includes('時長') || h.includes('訂閱'));
    console.log(`欄位索引 → 時間:${idxTime} 姓名:${idxName} 地址:${idxAddress} 連結:${idxMapsUrl} 方案:${idxPlan}`);

    // 過濾有效資料列（需有姓名且有清掃時間）
    const dataRows = calRows.slice(1).filter(r => {
      if (!r || !r.some(c => c)) return false;
      const hasName = idxName >= 0 ? !!(r[idxName] || '').trim() : true;
      const hasTime = idxTime >= 0 ? !!(r[idxTime] || '').trim() : true;
      return hasName && hasTime;
    });
    console.log(`有效資料列: ${dataRows.length}`);

    // --- mode: preview ---
    if (mode === 'preview') {
      return Response.json({
        mode: 'preview',
        source_sheet: SOURCE_SHEET,
        headers: calHeaders,
        sample_rows: dataRows.slice(0, 5),
        total_rows: dataRows.length,
        db_sheets: dbSheets.map(s => s.title),
      });
    }

    // --- mode: migrate ---
    // 分組：依方案/姓名判斷目標工作表
    const grouped = {}; // sheetTitle → { sheetObj, rows[] }
    for (const row of dataRows) {
      const plan = idxPlan >= 0 ? (row[idxPlan] || '') : '';
      const name = idxName >= 0 ? (row[idxName] || '') : '';
      const sheetObj = resolveTargetSheet(dbSheets, plan, name);
      if (!sheetObj) {
        console.warn(`找不到對應工作表，跳過: plan="${plan}" name="${name}"`);
        continue;
      }
      const key = sheetObj.title;
      if (!grouped[key]) grouped[key] = { sheetObj, rows: [] };
      grouped[key].rows.push(row);
    }

    console.log('分組結果:', JSON.stringify(Object.entries(grouped).map(([k, v]) => ({ sheet: k, count: v.rows.length }))));

    // 先清除目標工作表
    for (const { sheetObj } of Object.values(grouped)) {
      await clearSheet(accessToken, sheetObj.title);
      console.log(`已清除 "${sheetObj.title}"`);
    }

    // 寫入各工作表
    const allResults = [];
    for (const { sheetObj, rows } of Object.values(grouped)) {
      const prefix = sheetObj.title.charAt(0);
      const outputRows = rows.map((row, i) => {
        const dbId    = `${prefix}${i + 1}`;
        const timeStr = idxTime    >= 0 ? (row[idxTime]    || '') : '';
        const name    = idxName    >= 0 ? (row[idxName]    || '') : '';
        const address = idxAddress >= 0 ? (row[idxAddress] || '') : '';
        const mapsUrl = idxMapsUrl >= 0 ? (row[idxMapsUrl] || '') : '';
        const plan    = idxPlan    >= 0 ? (row[idxPlan]    || '') : '';
        // 格式：A編號 B清掃時間 C姓名 D電話(空) E地址 F地址連結 G方案/費用
        return [dbId, timeStr, name, '', address, mapsUrl, plan];
      });

      const result = await writeRows(accessToken, sheetObj.title, outputRows);
      console.log(`"${sheetObj.title}" 寫入 ${outputRows.length} 列，更新格數: ${result?.updatedCells}`);
      allResults.push({ sheet: sheetObj.title, inserted: outputRows.length, updatedCells: result?.updatedCells });
    }

    return Response.json({ success: true, source: SOURCE_SHEET, results: allResults });

  } catch (error) {
    console.error('migrateCalendarToDb error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});