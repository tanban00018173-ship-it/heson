import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
    const bookings = await base44.entities.Booking.list('-created_date', 500);

    // 試算表 ID（固定）
    const spreadsheetId = 'heson_bookings_sync';
    let sheetId = null;

    // 1. 檢查試算表是否存在，若不存在則建立
    let spreadsheet;
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.status === 404) {
        // 建立新試算表
        const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: { title: 'HESON 清潔訂單' },
            sheets: [{
              properties: { title: '預約清單' }
            }]
          })
        });
        spreadsheet = await createRes.json();
        sheetId = spreadsheet.sheets[0].properties.sheetId;
      } else {
        spreadsheet = await res.json();
        sheetId = spreadsheet.sheets[0].properties.sheetId;
      }
    } catch (err) {
      console.error('Failed to get/create spreadsheet:', err);
      return Response.json({ error: 'Failed to manage spreadsheet' }, { status: 500 });
    }

    // 2. 準備資料
    const headers = ['客戶姓名', '服務類型', '預約日期', '時段', '狀態', '地址', '指派清潔師', '備註', '建立時間'];
    const values = [headers];
    for (const booking of bookings) {
      values.push([
        booking.client_name || '',
        booking.service_type || '',
        booking.scheduled_date || '',
        booking.time_slot || '',
        booking.status || '',
        booking.address || '',
        booking.cleaner_name || '',
        booking.notes || '',
        booking.created_date ? new Date(booking.created_date).toLocaleDateString('zh-TW') : ''
      ]);
    }

    // 3. 更新試算表
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'預約清單'!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!updateRes.ok) {
      throw new Error('Failed to update sheet');
    }

    // 4. 保存試算表 ID 到資料庫
    const logs = await base44.entities.GoogleSheetLog.filter({ spreadsheet_id: spreadsheetId });
    if (logs.length === 0) {
      await base44.entities.GoogleSheetLog.create({
        spreadsheet_id: spreadsheetId,
        spreadsheet_name: 'HESON 清潔訂單',
        sheet_name: '預約清單',
        operation_type: 'ai_fill',
        status: 'success',
        cells_affected: ['A1:I' + values.length],
        notes: '自動同步 Booking 資料'
      });
    }

    return Response.json({
      success: true,
      spreadsheetId,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      rowCount: values.length - 1
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});