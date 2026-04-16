import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Check if sheet already exists in app metadata
    let sheetId = null;
    try {
      const appMeta = await base44.auth.getAppMetadata?.();
      sheetId = appMeta?.booking_sheet_id;
    } catch (e) {
      // Metadata not available, will create new
    }

    // If no existing sheet, create one
    if (!sheetId) {
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: 'HESON 清潔訂單管理'
          },
          sheets: [{
            properties: {
              sheetId: 0,
              title: '清潔訂單',
              gridProperties: { rowCount: 1000, columnCount: 9 }
            }
          }]
        })
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        return Response.json({ error: `Failed to create sheet: ${err}` }, { status: 500 });
      }

      const newSheet = await createRes.json();
      sheetId = newSheet.spreadsheetId;

      // Add headers
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'清潔訂單'!A1:I1?valueInputOption=RAW`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [['客戶姓名', '服務類型', '預約日期', '時段', '狀態', '地址', '指派管理師', '備註', '建立時間']]
        })
      });
    }

    // Sync all bookings to sheet
    const bookings = await base44.asServiceRole.entities.Booking.list('-created_date', 500);
    const values = bookings.map(b => [
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

    if (values.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'清潔訂單'!A2?valueInputOption=RAW`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      });
    }

    return Response.json({
      sheetId,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
      bookingCount: bookings.length
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});