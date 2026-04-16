import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Get sheet ID
    const sheets = await base44.asServiceRole.entities.CustomSheet.filter({ spreadsheet_id: 'booking_main' });
    if (!sheets.length) {
      return Response.json({ error: 'Sheet not initialized' }, { status: 400 });
    }
    const sheetId = sheets[0].spreadsheet_id;

    // Fetch all bookings
    const bookings = await base44.asServiceRole.entities.Booking.list('-created_date', 500);

    // Convert to sheet format
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

    // Append to Google Sheet
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'訂單'!A2:append?valueInputOption=RAW`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });

    return Response.json({ synced: bookings.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});