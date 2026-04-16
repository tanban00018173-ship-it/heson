import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SPREADSHEET_ID = '10kfWum36sfQyzIMlh0AF_l6dTVwurY4lahbo2eUVrbw';
const SHEET_NAME = '清潔訂單';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all bookings
    const bookings = await base44.entities.Booking.list('-created_date', 500);

    // Get Google Sheets access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Prepare data: headers + booking rows
    const headers = ['客戶姓名', '服務類型', '預約日期', '時段', '狀態', '地址', '指派管理師', '備註', '建立時間'];
    const rows = bookings.map(b => [
      b.client_name || '',
      b.service_type || '',
      b.scheduled_date || '',
      b.time_slot || '',
      b.status || '',
      b.address || '',
      b.cleaner_name || '',
      b.notes || '',
      b.created_date ? new Date(b.created_date).toLocaleString('zh-TW') : ''
    ]);

    // Clear and update sheet
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?alt=json`;
    await fetch(clearUrl, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    // Write headers + data
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?valueInputOption=RAW`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [headers, ...rows]
      })
    });

    const result = await updateRes.json();
    return Response.json({ success: true, updated_cells: result.updatedCells });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});