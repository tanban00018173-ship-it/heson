import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// 訂單資料庫試算表 ID
const DB_SHEET_ID = '10UDfGk4AZsC1Q_esUn2dO5PPfZ8m6ToSfeDk3mHzXG4';

// 服務類型 → 子工作表名稱 + 前綴
function resolveSheet(serviceType) {
  const s = (serviceType || '').toLowerCase();
  if (s.includes('民宿') || s.includes('退租') || s.includes('空屋') || s.includes('旅宿')) {
    return { sheetName: 'H／民宿清潔', prefix: 'H' };
  }
  if (s.includes('毛坯') || s.includes('裝潢後') || s.includes('新成屋')) {
    return { sheetName: 'P／毛坯案件', prefix: 'P' };
  }
  if (s.includes('大掃除') || s.includes('細清') || s.includes('深層') || s.includes('精緻')) {
    return { sheetName: 'D／細清案件', prefix: 'D' };
  }
  if (
    s.includes('定期') || s.includes('月護') || s.includes('月安') || s.includes('月綻') ||
    s.includes('基礎月') || s.includes('進階月') || s.includes('尊綻') ||
    s.includes('4次') || s.includes('8次') || s.includes('12次')
  ) {
    return { sheetName: 'R／定清案件', prefix: 'R' };
  }
  return { sheetName: 'L／輕量案件', prefix: 'L' };
}

// 取得該工作表目前最大編號，決定下一個流水號
async function getNextIndex(accessToken, sheetName) {
  const range = `${sheetName}!A2:A1000`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DB_SHEET_ID}/values/${encodeURIComponent(range)}`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  if (!res.ok) return 1;
  const data = await res.json();
  const rows = data.values || [];
  // 找最大的數字部分（e.g. "R5" → 5）
  let max = 0;
  for (const row of rows) {
    const cell = (row[0] || '').replace(/[A-Za-z\uff00-\uffff\/\s]/g, '');
    const n = parseInt(cell, 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

// 格式化地址連結（Google Maps URL）
function mapsLink(address) {
  if (!address) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, bookingData } = body;

    if (!bookingId || !bookingData) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    const { sheetName, prefix } = resolveSheet(bookingData.service_type);
    console.log(`Service type: "${bookingData.service_type}" → Sheet: "${sheetName}"`);

    // 確認工作表存在
    const infoRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${DB_SHEET_ID}?fields=sheets.properties`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!infoRes.ok) throw new Error(`無法取得試算表資訊: ${await infoRes.text()}`);
    const info = await infoRes.json();
    const allSheets = info.sheets || [];
    const found = allSheets.find(s => s.properties.title === sheetName);
    if (!found) {
      const available = allSheets.map(s => s.properties.title).join(', ');
      throw new Error(`找不到子工作表 "${sheetName}"，現有：${available}`);
    }

    // 決定流水號
    const nextIdx = await getNextIndex(accessToken, sheetName);
    const dbId = `${prefix}${nextIdx}`;

    // 彈性欄位（extra_fields）展開成字串附加
    let extraStr = '';
    if (bookingData.extra_fields && typeof bookingData.extra_fields === 'object') {
      extraStr = Object.entries(bookingData.extra_fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join('、');
    }

    // 費用說明
    const amountStr = bookingData.amount ? `${bookingData.amount} 元` : '';
    const planStr = [bookingData.service_type, amountStr].filter(Boolean).join(' / ');

    // 欄位對齊截圖：A編號、B清掃時間、C姓名、D電話、E需要服務地址、F地址連結、G細清方案/費用
    // 後續附加欄：H備註、I業務類型、J訂單ID、K extra_fields
    const scheduledDateStr = bookingData.scheduled_date || '';
    const timeSlotStr = bookingData.time_slot || '';
    const cleaningTime = [scheduledDateStr, timeSlotStr].filter(Boolean).join(' ');

    const rowValues = [
      dbId,                                        // A: 編號（自動產生，如 R1）
      cleaningTime,                                // B: 清掃時間（日期 + 時段）
      bookingData.client_name || '',               // C: 姓名
      bookingData.phone || '',                     // D: 電話
      bookingData.address || '',                   // E: 需要服務地址
      mapsLink(bookingData.address),               // F: 地址連結（Google Maps URL）
      planStr,                                     // G: 細清方案 / 費用
      bookingData.notes || '',                     // H: 備註
      bookingData.business_type || '',             // I: 業務類型
      bookingId,                                   // J: 訂單 ID
      extraStr,                                    // K: extra_fields
    ];

    // 用 values:append 追加一列
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${DB_SHEET_ID}/values/${encodeURIComponent(sheetName + '!A1')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [rowValues] })
      }
    );

    if (!appendRes.ok) {
      const err = await appendRes.json();
      throw new Error(`Sheets append 失敗: ${JSON.stringify(err)}`);
    }

    // 將 db_id 回寫到 Booking entity
    try {
      await base44.asServiceRole.entities.Booking.update(bookingId, { sheet_db_id: dbId });
    } catch (e) {
      console.warn('回寫 sheet_db_id 失敗（非關鍵）:', e.message);
    }

    // 記錄 log
    try {
      await base44.asServiceRole.entities.GoogleSheetLog.create({
        spreadsheet_id: DB_SHEET_ID,
        spreadsheet_name: '訂單資料庫',
        sheet_name: sheetName,
        operation_type: 'ai_fill',
        status: 'success',
        data_filled: { booking_id: bookingId, db_id: dbId, client_name: bookingData.client_name },
        cells_affected: [],
        notes: `新訂單 ${dbId} append → ${sheetName}`,
      });
    } catch (logErr) {
      console.warn('Log 失敗（非關鍵）:', logErr);
    }

    return Response.json({ success: true, db_id: dbId, sheet: sheetName });
  } catch (error) {
    console.error('syncBookingToSheet error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});