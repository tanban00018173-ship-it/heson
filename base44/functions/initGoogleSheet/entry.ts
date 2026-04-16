import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Check if sheet already exists
    const existing = await base44.entities.CustomSheet.filter({ spreadsheet_id: 'booking_main' });
    if (existing.length > 0) {
      return Response.json({ spreadsheet_id: existing[0].spreadsheet_id });
    }

    // Create new Google Sheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: { title: '清潔訂單 - HESON' },
        sheets: [{
          properties: {
            sheetId: 0,
            title: '訂單',
            gridProperties: { rowCount: 1000, columnCount: 9 }
          }
        }]
      })
    });

    const sheet = await createRes.json();
    const sheetId = sheet.spreadsheetId;

    // Add headers
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'訂單'!A1:I1?valueInputOption=RAW`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [['客戶姓名', '服務類型', '預約日期', '時段', '狀態', '地址', '指派管理師', '備註', '建立時間']]
      })
    });

    // Save to CustomSheet for reference
    await base44.asServiceRole.entities.CustomSheet.create({
      spreadsheet_id: 'booking_main',
      data: [],
      row_count: 0,
      col_count: 9,
      col_widths: Array(9).fill(120),
      row_heights: [],
      cell_formats: {},
      col_names: ['客戶姓名', '服務類型', '預約日期', '時段', '狀態', '地址', '指派管理師', '備註', '建立時間']
    });

    return Response.json({ spreadsheet_id: sheetId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});