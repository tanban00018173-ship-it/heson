import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// 月曆排程試算表（來源）
const CALENDAR_ID = '1U0V5hXjrBo8Qh51vpPb6TfF2LOp05pKXTgtakz_YZvQ';
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

// 驗證工作表標題行並返回欄位索引
async function getSheetHeaderIndices(accessToken, sheetTitle) {
  const range = encodeURIComponent(`${sheetTitle}!A1:H1`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`讀取標題失敗 "${sheetTitle}": ${err.error?.message}`);
  }
  const data = await res.json();
  const headers = (data.values?.[0] || []).map(h => (h || '').trim());
  
  console.log(`"${sheetTitle}" 標題: [${headers.join('|')}]`);
  
  // 查找各欄位索引（模糊匹配）
  const idxNum = headers.findIndex(h => h.includes('編號'));
  const idxTime = headers.findIndex(h => h.includes('清掃時間') || h.includes('時間'));
  const idxName = headers.findIndex(h => h.includes('姓名'));
  const idxPhone = headers.findIndex(h => h.includes('電話') || h.includes('聯繫'));
  const idxAddr = headers.findIndex(h => h.includes('需要服務地址') || h.includes('地址'));
  const idxMap = headers.findIndex(h => h.includes('地址連結') || h.includes('地圖'));
  
  if (idxNum < 0 || idxName < 0 || idxAddr < 0) {
    throw new Error(`"${sheetTitle}" 缺少必要欄位（編號、姓名、地址）`);
  }
  
  return { idxNum, idxTime, idxName, idxPhone, idxAddr, idxMap, headerCount: headers.length };
}

// 寫入資料（values.append API，依據表格標題動態調整欄位）
async function writeRows(accessToken, sheetTitle, sheetId, rows) {
  if (!rows || rows.length === 0) return { updatedCells: 0 };

  // 讀取標題並獲得欄位索引
  const indices = await getSheetHeaderIndices(accessToken, sheetTitle);
  const { idxNum, idxTime, idxName, idxPhone, idxAddr, idxMap } = indices;
  
  // 根據表格的實際欄位結構，重新整理資料行
  // rows 的格式是 [編號, 清掃時間, 姓名, 空, 地址, 地址連結]
  // 但表格可能沒有清掃時間欄，需要動態對應
  const adjustedRows = rows.map(row => {
    const adjustedRow = new Array(indices.headerCount).fill('');
    
    // 對應欄位值（row 格式：[編號, 清掃時間, 姓名, 電話, 地址, 地址連結]）
    adjustedRow[idxNum] = row[0] || ''; // 編號
    if (idxTime >= 0) adjustedRow[idxTime] = row[1] || ''; // 清掃時間（如果存在）
    adjustedRow[idxName] = row[2] || ''; // 姓名
    if (idxPhone >= 0) adjustedRow[idxPhone] = row[3] || ''; // 電話（如果存在）
    adjustedRow[idxAddr] = row[4] || ''; // 地址
    if (idxMap >= 0) adjustedRow[idxMap] = row[5] || ''; // 地址連結（如果存在）
    
    return adjustedRow.slice(0, indices.headerCount);
  });

  // Step 1: 用 values.append 寫入資料
  const appendRange = encodeURIComponent(`${sheetTitle}!A2`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}/values/${appendRange}:append?valueInputOption=RAW&insertDataOption=OVERWRITE`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: adjustedRows }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`寫入失敗 "${sheetTitle}": ${err.error?.message}`);
  }
  const appendResult = await res.json();

  // Step 2: 用 batchUpdate 強制設定字體為黑色（避免白字問題）
  const numRows = adjustedRows.length;
  const numCols = Math.min(6, indices.headerCount);
  const formatRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: 1 + numRows,
              startColumnIndex: 0,
              endColumnIndex: numCols,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { foregroundColor: { red: 0, green: 0, blue: 0 }, bold: false },
                backgroundColor: { red: 1, green: 1, blue: 1 },
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          }
        }]
      }),
    }
  );
  if (!formatRes.ok) {
    const err = await formatRes.json();
    console.warn(`格式設定失敗（非關鍵）: ${err.error?.message}`);
  }

  return { updatedCells: appendResult.updates?.updatedCells };
}

// 用前綴字母找工作表
function findSheetByPrefix(dbSheets, prefix) {
  const result = dbSheets.find(s => s.title.charAt(0) === prefix);
  console.log(`findSheetByPrefix("${prefix}") from [${dbSheets.map(s => s.title).join(', ')}] → ${result?.title || 'null'}`);
  return result;
}

// 根據方案/姓名/編號決定目標工作表
function resolveTargetSheet(dbSheets, plan, name, idNum) {
  // 最高優先：編號欄若以 H/R/L/D/P 開頭，直接按前綴分類
  const idPrefix = (idNum || '').trim().toUpperCase().charAt(0);
  if (['H', 'R', 'L', 'D', 'P'].includes(idPrefix)) {
    return findSheetByPrefix(dbSheets, idPrefix);
  }
  const p = (plan || '');
  const n = (name || '');
  // 民宿/旅宿類 → H
  if (p.includes('民宿') || p.includes('旅宿') || p.includes('退租') || n.includes('民宿') || n.includes('旅宿') || n.includes('旅行')) {
    return findSheetByPrefix(dbSheets, 'H');
  }
  // 毛坯/裝潢後 → P
  if (p.includes('毛坯') || p.includes('裝潢後') || p.includes('新成屋')) {
    return findSheetByPrefix(dbSheets, 'P');
  }
  // 細清/大掃除 → D
  if (p.includes('大掃除') || p.includes('細清') || p.includes('深層') || p.includes('精緻')) {
    return findSheetByPrefix(dbSheets, 'D');
  }
  // 定期訂閱（每月N次格式）→ R
  if (p.includes('訂閱') || p.match(/每月\s*\d+\s*次/) || p.match(/\d+\s*小時\s*[×x]\s*每月/) || p.includes('每月')) {
    return findSheetByPrefix(dbSheets, 'R');
  }
  // 輕量 → L（單次、輕量、或其他）
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
    let allSheets = await getSpreadsheetSheets(accessToken, DB_ID);
    console.log('所有工作表:', JSON.stringify(allSheets.map(s => s.title)));
    
    // 只保留有 "/" 或 "／" 的工作表（排除表單回應等）
    let dbSheets = allSheets.filter(s => s.title.includes('／') || s.title.includes('/'));
    console.log('篩選後DB工作表:', JSON.stringify(dbSheets.map(s => s.title)));
    
    // 若無合格工作表，顯示完整列表供調試
    if (dbSheets.length === 0) {
      console.warn('警告：沒有找到符合條件的工作表（應包含 / 或 ／）。完整列表:', allSheets.map(s => s.title).join(', '));
      dbSheets = allSheets; // 暫用全部工作表作為備選
    }

    // --- mode: debug_read（讀回 DB 驗證） ---
    if (mode === 'debug_read') {
      const sheetTitle = body.sheet || 'H／民宿清潔';
      const rows = await readSheet(accessToken, DB_ID, sheetTitle);
      return Response.json({ sheet: sheetTitle, row_count: rows.length, rows: rows.slice(0, 10) });
    }

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
    const idxCleaner = calHeaders.findIndex(h => h.includes('清潔人員') || h.includes('清掃人員'));
    const idxIdNum   = calHeaders.indexOf('編號');
    console.log(`欄位索引 → 時間:${idxTime} 姓名:${idxName} 地址:${idxAddress} 連結:${idxMapsUrl} 方案:${idxPlan} 清潔人員:${idxCleaner}`);

    // 過濾有效資料列（需有清掃時間，姓名可能在「編號」欄）
    const dataRows = calRows.slice(1).filter(r => {
      if (!r || !r.some(c => c)) return false;
      // 姓名可能在 idxName 或 idxIdNum（當編號欄填的是名稱時）
      const nameFromName = idxName >= 0 ? (r[idxName] || '').trim() : '';
      const nameFromId   = idxIdNum >= 0 ? (r[idxIdNum] || '').trim() : '';
      const hasName = !!(nameFromName || nameFromId);
      const hasTime = idxTime >= 0 ? !!(r[idxTime] || '').trim() : true;
      return hasName && hasTime;
    });
    console.log(`有效資料列: ${dataRows.length}`);

    // --- mode: preview ---
    if (mode === 'preview') {
      const offset = body.offset || 0;
      const limit = body.limit || 10;
      return Response.json({
        mode: 'preview',
        source_sheet: SOURCE_SHEET,
        headers: calHeaders,
        total_raw: calRows.length - 1,
        total_valid: dataRows.length,
        raw_rows: calRows.slice(1 + offset, 1 + offset + limit),
        db_sheets: dbSheets.map(s => s.title),
      });
    }

    // --- mode: migrate ---
    // 從清掃時間字串中抽取時間段，修正12小時制問題
    // 例：「4/10(五)1:00-5:00」→ 下午 → "13:00-17:00"
    // 例：「4/12(日) 上午11:00」→ "11:00"
    function toHour24(h, isPM) {
      let n = parseInt(h, 10);
      if (isPM && n < 12) n += 12;
      if (!isPM && n === 12) n = 0;
      return String(n).padStart(2, '0');
    }
    function extractTimeSlot(raw) {
      if (!raw) return '';
      const isAM = /上午|AM/i.test(raw);
      const isPM = /下午|PM/i.test(raw);

      const match = raw.match(/(\d{1,2}):(\d{2})\s*[-~～至到]\s*(\d{1,2}):(\d{2})/);
      if (match) {
        const [, h1, m1, h2, m2] = match;
        const n1 = parseInt(h1, 10);
        const n2 = parseInt(h2, 10);
        // 無 AM/PM 標示時：若起始小時 < 8 判定為下午（台灣清潔班次慣例）
        const assumePM = !isAM && !isPM && n1 < 8;
        const start = `${toHour24(n1, isPM || assumePM)}:${m1}`;
        // 結束時間：若結束 < 開始（補12小時）或同樣判定
        const endN = n2 < n1 ? n2 + 12 : (isPM || assumePM ? (n2 < 12 ? n2 + 12 : n2) : n2);
        const end = `${String(endN).padStart(2, '0')}:${m2}`;
        return `${start}-${end}`;
      }
      // 只有單一時間
      const single = raw.match(/(\d{1,2}):(\d{2})/);
      if (single) {
        const [, h, m] = single;
        const n = parseInt(h, 10);
        const assumePM = !isAM && !isPM && n < 8;
        return `${toHour24(n, isPM || assumePM)}:${m}`;
      }
      return raw.trim();
    }

    // 標準化地址函數（去空格、標點，方便比對）
    function normalizeAddress(addr) {
    return (addr || '').replace(/\s+/g, '').replace(/[^\u4e00-\u9fff0-9a-zA-Z]/g, '');
    }

    // 以「姓名 + 標準化地址」為 key 合併同案場，並收集所有出現的時間段
    // grouped: sheetTitle → { sheetObj, cases: Map<caseKey, caseData> }
    const grouped = {};
    for (const row of dataRows) {
      const plan    = idxPlan    >= 0 ? (row[idxPlan]    || '') : '';
      // 姓名：優先取姓名欄，否則取編號欄（民宿客戶名稱有時填在編號欄）
      const nameFromName = idxName  >= 0 ? (row[idxName]  || '').trim() : '';
      const nameFromId   = idxIdNum >= 0 ? (row[idxIdNum] || '').trim() : '';
      const name    = nameFromName || nameFromId;
      const address = idxAddress >= 0 ? (row[idxAddress] || '').trim() : '';
      const mapsUrl = idxMapsUrl >= 0 ? (row[idxMapsUrl] || '') : '';
      const timeRaw = idxTime    >= 0 ? (row[idxTime]    || '') : '';
      const cleanerRaw = idxCleaner >= 0 ? (row[idxCleaner] || '') : '';
      // 清潔人員可能多位（換行分隔），統一成逗號分隔
      const cleaner = cleanerRaw.split(/\n|,|、/).map(s => s.trim()).filter(Boolean).join('、');
      const timeSlot = extractTimeSlot(timeRaw);

      const idNum = idxIdNum >= 0 ? (row[idxIdNum] || '') : '';
      const sheetObj = resolveTargetSheet(dbSheets, plan, name, idNum);
      if (!sheetObj) {
        console.warn(`找不到對應工作表，跳過: plan="${plan}" name="${name}"`);
        continue;
      }

      const sheetKey = sheetObj.title;
      if (!grouped[sheetKey]) grouped[sheetKey] = { sheetObj, cases: new Map() };

      // 案場唯一 key = 姓名 + 標準化地址（相同地址儘管格式略異也會合併）
      const normalizedAddr = normalizeAddress(address);
      const caseKey = `${name}||${normalizedAddr}`;
      if (!grouped[sheetKey].cases.has(caseKey)) {
        grouped[sheetKey].cases.set(caseKey, { name, address, mapsUrl, plan, timeSlots: new Set(), cleaners: new Set() });
      }
      const c = grouped[sheetKey].cases.get(caseKey);
      if (timeSlot) c.timeSlots.add(timeSlot);
      if (cleaner) cleaner.split('、').forEach(cl => c.cleaners.add(cl));
      // 保留非空的方案/地址連結
      if (!c.mapsUrl && mapsUrl) c.mapsUrl = mapsUrl;
      if (!c.plan && plan) c.plan = plan;
    }

    // 詳細 log 每筆被分到哪個工作表
    for (const row of dataRows) {
      const pl = idxPlan >= 0 ? (row[idxPlan] || '') : '';
      const idN = idxIdNum >= 0 ? (row[idxIdNum] || '') : '';
      const nm = idxName >= 0 ? (row[idxName] || '').trim() || idN.trim() : '';
      const sh = resolveTargetSheet(dbSheets, pl, nm, idN);
      console.log(`分類: "${nm}" | 編號="${idN}" | 方案="${pl.slice(0,20)}" → ${sh?.title || '找不到'}`);
    }
    console.log('分組結果:', JSON.stringify(Object.entries(grouped).map(([k, v]) => ({ sheet: k, cases: v.cases.size }))));

    // 先清除目標工作表（如果有資料）
    for (const { sheetObj } of Object.values(grouped)) {
      try {
        await clearSheet(accessToken, sheetObj.title);
        console.log(`已清除 "${sheetObj.title}"`);
      } catch (e) {
        console.warn(`清除 "${sheetObj.title}" 失敗（非關鍵）: ${e.message}`);
      }
    }

    // 寫入各工作表（每個唯一案場一列）
    const allResults = [];
    for (const { sheetObj, cases } of Object.values(grouped)) {
      const prefix = sheetObj.title.charAt(0);
      const outputRows = [];
      let idx = 1;
      for (const c of cases.values()) {
        const dbId = `${prefix}${idx++}`;
        // 清掃時間：將所有時間段合併（去重後以 / 分隔）
        const timeStr = [...c.timeSlots].join(' / ') || '';
        const cleanerStr = [...c.cleaners].join('、');
        // 格式：A編號 B清掃時間(時段) C姓名 D電話(空) E地址 F地址連結
        // 只寫前6列，對齊資料庫結構
        outputRows.push([dbId, timeStr, c.name, '', c.address, c.mapsUrl]);
      }

      const result = await writeRows(accessToken, sheetObj.title, sheetObj.sheetId, outputRows);
      console.log(`"${sheetObj.title}" 寫入 ${outputRows.length} 筆案場，更新格數: ${result?.updatedCells}`);
      allResults.push({ sheet: sheetObj.title, cases: outputRows.length, updatedCells: result?.updatedCells });
    }

    // 回傳每筆分類細節供驗證
    const classifyDetail = dataRows.map(row => {
      const pl = idxPlan >= 0 ? (row[idxPlan] || '') : '';
      const idN = idxIdNum >= 0 ? (row[idxIdNum] || '') : '';
      const nm = idxName >= 0 ? (row[idxName] || '').trim() || idN.trim() : '';
      const sh = resolveTargetSheet(dbSheets, pl, nm, idN);
      return { name: nm, idNum: idN, plan: pl.slice(0, 30), sheet: sh?.title || '找不到' };
    });
    return Response.json({ success: true, source: SOURCE_SHEET, results: allResults, classify: classifyDetail });

  } catch (error) {
    console.error('migrateCalendarToDb error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});