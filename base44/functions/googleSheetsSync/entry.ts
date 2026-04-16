import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { action, spreadsheetId, range, values, rowIndex, colIndex } = await req.json();
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    const sheetsAPI = 'https://sheets.googleapis.com/v4/spreadsheets';

    if (action === 'read') {
      const resp = await fetch(`${sheetsAPI}/${spreadsheetId}/values/${range}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await resp.json();
      return Response.json({ values: data.values || [] });
    }

    if (action === 'write') {
      const resp = await fetch(`${sheetsAPI}/${spreadsheetId}/values/${range}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      });
      const data = await resp.json();
      return Response.json({ success: !!data.updatedCells });
    }

    if (action === 'insertRows') {
      const resp = await fetch(`${sheetsAPI}/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            insertDimension: {
              range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }]
        })
      });
      return Response.json({ success: await resp.ok });
    }

    if (action === 'deleteRows') {
      const resp = await fetch(`${sheetsAPI}/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }]
        })
      });
      return Response.json({ success: await resp.ok });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});