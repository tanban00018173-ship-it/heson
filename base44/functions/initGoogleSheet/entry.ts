import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { spreadsheetId, bookings } = await req.json();

    if (!spreadsheetId || !bookings || bookings.length === 0) {
      return Response.json({ error: 'Missing spreadsheetId or bookings' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Column headers
    const headers = ['客戶姓名', '服務類型', '預約日期', '時段', '狀態', '地址', '指派管理師', '備註', '建立時間'];

    // Convert bookings to rows
    const rows = bookings.map(b => [
      b.client_name || '',
      b.service_type || '',
      b.scheduled_date || '',
      b.time_slot || '',
      b.status || '',
      b.address || '',
      b.cleaner_name || '',
      b.notes || '',
      b.created_date || ''
    ]);

    // Prepare data for Google Sheets API
    const values = [headers, ...rows];

    // Write to Google Sheets
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: error }, { status: response.status });
    }

    return Response.json({ success: true, rowsUpdated: rows.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});