import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { sheetId, booking } = await req.json();

    if (!sheetId) {
      return Response.json({ error: 'No sheetId provided' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Fetch all bookings and sync to sheet
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

    // Clear old data and write new
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          deleteRange: {
            range: { sheetId: 0, startRowIndex: 1 }
          }
        }]
      })
    });

    // Write new data
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

    return Response.json({ success: true, synced: values.length });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});