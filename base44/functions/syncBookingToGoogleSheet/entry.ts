import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    // 從 entity automation 或直接調用
    const booking = body.data || body.booking;
    const spreadsheetId = body.spreadsheetId || localStorage.getItem('bookingSheetId');

    if (!spreadsheetId || !booking) {
      return Response.json({ success: false, error: '缺少試算表 ID 或預約資料' }, { status: 200 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 取得現有資料
    const getRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/訂單`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const data = await getRes.json();
    const rows = data.values || [['客戶', '服務類型', '日期', '時段', '狀態', '地址', '管理師', '備註']];

    // 檢查是否已存在（根據 booking id）
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][8] === booking.id) { // 第9欄存 id
        rowIndex = i;
        break;
      }
    }

    const newRow = [
      booking.client_name || '',
      booking.service_type || '',
      booking.scheduled_date || '',
      booking.time_slot || '',
      booking.status || '',
      booking.address || '',
      booking.cleaner_name || '',
      booking.notes || '',
      booking.id
    ];

    if (rowIndex >= 0) {
      rows[rowIndex] = newRow;
    } else {
      rows.push(newRow);
    }

    // 更新試算表
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/訂單?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: rows })
      }
    );

    return Response.json({ success: true, message: '同步成功' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});