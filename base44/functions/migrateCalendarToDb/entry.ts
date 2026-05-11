import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// 月曆排程試算表
const CALENDAR_ID = '1AgmwQLTTtslxU8Fn5GNdF9IjDAf4ih7ea5zmCUbuWWs';
// 訂單資料庫試算表
const DB_ID = '10UDfGk4AZsC1Q_esUn2dO5PPfZ8m6ToSfeDk3mHzXG4';

async function readSheet(accessToken, spreadsheetId, sheetName) {
  const range = `${sheetName}!A1:Z2000`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`讀取 "${sheetName}" 失敗: ${err.error?.message}`);
  }
  const data = await res.json();
  return data.values || [];
}

async function getNextIndex(accessToken, dbSheetName, prefix) {
  const range = `${dbSheetName}!A2:A1000`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return 1;
  const data = await res.json();
  const rows = data.values || [];
  let max = 0;
  for (const row of rows) {
    const cell = (row[0] || '').toString();
    // 只計算同前綴的（如 R1, R2...）
    if (cell.startsWith(prefix)) {
      const num = parseInt(cell.slice(prefix.length), 10);
      if (!isNaN(num) && num > max) max = num;
    }
  }
  return max + 1;
}

// 批次 append（避免 quota 問題，一次寫多列）
async function appendRows(accessToken, dbSheetName, rows) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}/values/${encodeURIComponent(dbSheetName + '!A1')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`批次寫入失敗: ${err.error?.message}`);
  }
  return await res.json();
}

// 清除某工作表 A2 以下的所有資料
async function clearSheet(accessToken, dbSheetName) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}/values/${encodeURIComponent(dbSheetName + '!A2:Z2000')}:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`清除失敗: ${err.error?.message}`);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'preview'; // preview | migrate | clear_all

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // --- mode: clear_all ---
    // 清除訂單資料庫所有工作表的資料列（保留表頭）
    if (mode === 'clear_all') {
      const dbInfoRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}?fields=sheets.properties`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const dbInfo = await dbInfoRes.json();
      const dbSheets = (dbInfo.sheets || []).map(s => s.properties.title).filter(t => t !== '表單回應 1');
      for (const s of dbSheets) {
        await clearSheet(accessToken, s);
        console.log(`已清除 ${s}`);
      }
      return Response.json({ success: true, cleared: dbSheets });
    }

    // 讀取月曆「4月排序」工作表
    const SOURCE_SHEET = '4月排序（26_4/10-5/9）';
    const calRows = await readSheet(accessToken, CALENDAR_ID, SOURCE_SHEET);
    if (calRows.length < 2) {
      return Response.json({ error: `"${SOURCE_SHEET}" 沒有資料` }, { status: 400 });
    }

    const calHeaders = calRows[0].map(h => (h || '').trim());
    // 嚴格過濾：姓名欄(idxName)和清掃時間欄(idxTime)都要有值才算有效列
    // 先算欄位索引
    const _idxName = calHeaders.indexOf('姓名');
    const _idxTime = calHeaders.indexOf('清掃時間');
    const dataRows = calRows.slice(1).filter(r => {
      if (!r || !r.some(c => c)) return false;
      const hasName = _idxName >= 0 ? !!(r[_idxName] || '').trim() : true;
      const hasTime = _idxTime >= 0 ? !!(r[_idxTime] || '').trim() : true;
      return hasName && hasTime;
    });

    console.log('月曆欄位:', calHeaders.join(' | '));
    console.log(`共 ${dataRows.length} 列資料`);

    // --- mode: preview ---
    // 只回傳前5列讓你確認欄位對應，不寫入
    if (mode === 'preview') {
      return Response.json({
        mode: 'preview',
        source_sheet: SOURCE_SHEET,
        headers: calHeaders,
        sample_rows: dataRows.slice(0, 5),
        total_rows: dataRows.length,
      });
    }

    // --- mode: migrate ---
    // 必須先傳入 fieldMap：{ dbColIndex: calColIndex | 'fixed:值' }
    // 或使用 autoMap 模式（依欄位名稱自動對應）
    // 讀取訂單資料庫的表頭
    const dbHeaders = (await readSheet(accessToken, DB_ID, 'R／定清案件'))[0] || [];
    const dbColCount = dbHeaders.length;
    console.log('訂單資料庫欄位:', dbHeaders.join(' | '));

    // 月曆欄位索引（依 preview 確認的實際欄位）
    // 編號(0), 清潔人員(1), 清掃時間(2), 姓名(3), 進行狀況(4), 進帳(5), 支出(6),
    // 需要服務地址(7), 地址連結(8), 想要的時長×次數/訂閱制(9)
    const idxTime     = calHeaders.indexOf('清掃時間');
    const idxName     = calHeaders.indexOf('姓名');
    const idxAddress  = calHeaders.indexOf('需要服務地址');
    const idxMapsUrl  = calHeaders.indexOf('地址連結');
    const idxPlan     = calHeaders.findIndex(h => h.includes('時長') || h.includes('訂閱'));

    console.log(`欄位對應 → 時間:${idxTime} 姓名:${idxName} 地址:${idxAddress} 地址連結:${idxMapsUrl} 方案:${idxPlan}`);

    // 依方案內容分類到對應工作表
    function resolveTargetSheet(plan, name) {
      const p = (plan || '').toLowerCase();
      const n = (name || '').toLowerCase();
      if (p.includes('民宿') || p.includes('旅宿') || p.includes('退租') || n.includes('民宿') || n.includes('旅宿')) {
        return 'H／民宿清潔';
      }
      if (p.includes('毛坯') || p.includes('裝潢後') || p.includes('新成屋')) {
        return 'P／毛坯案件';
      }
      if (p.includes('大掃除') || p.includes('細清') || p.includes('深層') || p.includes('精緻')) {
        return 'D／細清案件';
      }
      if (p.includes('每月') || p.includes('月') || p.includes('訂閱') || p.includes('次')) {
        return 'R／定清案件';
      }
      return 'L／輕量案件';
    }

    // 依目標工作表分組
    const grouped = {}; // { sheetName: [row, ...] }
    const sheetNextIdx = {}; // { sheetName: nextIdx }

    for (const row of dataRows) {
      const plan    = idxPlan    >= 0 ? (row[idxPlan]    || '') : '';
      const name    = idxName    >= 0 ? (row[idxName]    || '') : '';
      const target  = resolveTargetSheet(plan, name);
      if (!grouped[target]) grouped[target] = [];
      grouped[target].push(row);
    }

    // 為每個目標工作表取流水號起點
    for (const sheetName of Object.keys(grouped)) {
      const p = sheetName.charAt(0);
      sheetNextIdx[sheetName] = await getNextIndex(accessToken, sheetName, p);
    }

    const allResults = [];

    for (const [targetSheet, rows] of Object.entries(grouped)) {
      const prefix = targetSheet.charAt(0);
      let nextIdx = sheetNextIdx[targetSheet];
      const outputRows = [];

      for (const row of rows) {
        const timeStr = idxTime    >= 0 ? (row[idxTime]    || '') : '';
        const name    = idxName    >= 0 ? (row[idxName]    || '') : '';
        const address = idxAddress >= 0 ? (row[idxAddress] || '') : '';
        const mapsUrl = idxMapsUrl >= 0 ? (row[idxMapsUrl] || '') : '';
        const plan    = idxPlan    >= 0 ? (row[idxPlan]    || '') : '';

        const dbId = `${prefix}${nextIdx}`;
        const outputRow = new Array(dbColCount).fill('');
        outputRow[0] = dbId;
        if (dbColCount > 1) outputRow[1] = timeStr;
        if (dbColCount > 2) outputRow[2] = name;
        if (dbColCount > 3) outputRow[3] = '';
        if (dbColCount > 4) outputRow[4] = address;
        if (dbColCount > 5) outputRow[5] = mapsUrl;
        if (dbColCount > 6) outputRow[6] = plan;

        outputRows.push(outputRow);
        nextIdx++;
      }

      // 批次寫入（一次 API 呼叫，避免超過 quota）
      await appendRows(accessToken, targetSheet, outputRows);
      allResults.push({ sheet: targetSheet, inserted: outputRows.length });
      console.log(`${targetSheet}: 寫入 ${outputRows.length} 列`);
    }

    return Response.json({ success: true, source: SOURCE_SHEET, results: allResults });

  } catch (error) {
    console.error('migrateCalendarToDb error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});