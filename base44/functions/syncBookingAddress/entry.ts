import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// 地址座標專用試算表設定
// 請將此 SPREADSHEET_ID 替換為您的 Google Sheets ID
const SPREADSHEET_ID = '1AgmwQLTTtslxU8Fn5GNdF9IjDAf4ih7ea5zmCUbuWWs';
const SHEET_NAME = '地址座標資料';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // 接收來自 automation 的 payload
    const payload = await req.json().catch(() => ({}));
    const { event, data } = payload;

    // 取得 booking 資料（優先用 payload，否則用 entity_id 查詢）
    let booking = data;
    if (!booking && event?.entity_id) {
      const results = await base44.asServiceRole.entities.Booking.filter({ id: event.entity_id });
      booking = results?.[0];
    }

    if (!booking) {
      return Response.json({ success: false, message: '無法取得預約資料' });
    }

    // 只處理有地址的預約
    if (!booking.address) {
      return Response.json({ success: true, message: '此預約無地址，略過' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 先確認 sheet 是否存在，若無則建立
    const sheetInfoRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const sheetInfo = await sheetInfoRes.json();
    const sheetExists = sheetInfo.sheets?.some(s => s.properties.title === SHEET_NAME);

    if (!sheetExists) {
      // 建立新工作表
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: SHEET_NAME } } }]
          })
        }
      );
      // 寫入標題列
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME + '!A1:K1')}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            values: [['預約ID', '客戶姓名', '服務類型', '服務地址', '緯度(lat)', '經度(lng)', 'Google Maps連結', '預約日期', '時段', '狀態', '最後更新']]
          })
        }
      );
    }

    // 讀取現有資料，找是否已有此 booking 的記錄
    const readRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME + '!A:A')}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const readData = await readRes.json();
    const rows = readData.values || [];

    // 找到此 booking 在 sheet 中的行號（從第2行開始，跳過標題）
    let existingRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === booking.id) {
        existingRowIndex = i + 1; // 1-indexed
        break;
      }
    }

    const mapsLink = booking.gps_lat && booking.gps_lng
      ? `https://www.google.com/maps?q=${booking.gps_lat},${booking.gps_lng}`
      : '';

    const rowData = [
      booking.id,
      booking.client_name || '',
      booking.service_type || '',
      booking.address || '',
      booking.gps_lat || '',
      booking.gps_lng || '',
      mapsLink,
      booking.scheduled_date || '',
      booking.time_slot || '',
      booking.status || '',
      new Date().toISOString().replace('T', ' ').slice(0, 19),
    ];

    if (existingRowIndex > 0) {
      // 更新現有列
      const range = `${SHEET_NAME}!A${existingRowIndex}:K${existingRowIndex}`;
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [rowData] })
        }
      );
    } else {
      // 新增到最後一列
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME + '!A:K')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [rowData] })
        }
      );
    }

    return Response.json({
      success: true,
      message: `預約 ${booking.id} 地址已同步`,
      action: existingRowIndex > 0 ? 'updated' : 'inserted',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});