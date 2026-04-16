import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get Google Sheet config
    const metadata = await base44.asServiceRole.system.getMetadata('google_sheet_config');
    if (!metadata || !metadata.spreadsheet_id) {
      return Response.json({ error: 'Google Sheet not initialized' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
    
    // Get all bookings
    const bookings = await base44.asServiceRole.entities.Booking.list('-created_date', 500);

    // Prepare data rows
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

    // Update sheet (starting from A2 to skip header)
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${metadata.spreadsheet_id}/values/'訂單'!A2:I?valueInputOption=RAW`,
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
      const error = await updateRes.json();
      return Response.json({ error: error.error.message }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      rows_synced: bookings.length,
      spreadsheet_url: metadata.spreadsheet_url
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});