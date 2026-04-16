import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { spreadsheetId } = await req.json();

    if (!spreadsheetId) {
      return Response.json({ error: 'Missing spreadsheetId' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Fetch data from Google Sheets
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: error }, { status: response.status });
    }

    const data = await response.json();
    const values = data.values || [];

    if (values.length <= 1) {
      return Response.json({ data: [] });
    }

    const headers = values[0];
    const rows = values.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] || '';
      });
      return obj;
    });

    return Response.json({ data: rows });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});