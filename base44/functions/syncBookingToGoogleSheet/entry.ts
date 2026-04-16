import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SPREADSHEET_ID = '10kfWum36sfQyzIMlh0AF_l6dTVwurY4lahbo2eUVrbw';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all bookings
    const bookings = await base44.entities.Booking.list('-created_date', 500);
    
    // Get access token for Google Sheets
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Prepare data for Google Sheets
    const values = [
      ['客戶姓名', '服務類型', '預約日期', '時段', '狀態', '地址', '指派管理師', '備註', '建立時間']
    ];

    bookings.forEach(b => {
      values.push([
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
    });

    // Update Google Sheet
    const sheetName = '清潔訂單';
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/'${sheetName}'!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return Response.json({ error: error.error?.message || 'Failed to update sheet' }, { status: 400 });
    }

    const result = await response.json();
    return Response.json({ 
      success: true, 
      updatedCells: result.updatedCells,
      totalBookings: bookings.length 
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});