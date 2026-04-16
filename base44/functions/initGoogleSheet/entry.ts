import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get authorized Google Sheets connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Check if spreadsheet already exists in system metadata
    const metadata = await base44.asServiceRole.system.getMetadata('google_sheet_config') || {};
    
    if (metadata.spreadsheet_id && metadata.spreadsheet_url) {
      return Response.json({ 
        spreadsheet_id: metadata.spreadsheet_id,
        spreadsheet_url: metadata.spreadsheet_url,
        sheet_id: metadata.sheet_id || 0
      });
    }

    // Create new spreadsheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: 'HESON 清潔訂單'
        },
        sheets: [{
          properties: {
            sheetId: 0,
            title: '訂單',
            gridProperties: {
              rowCount: 1000,
              columnCount: 9
            }
          }
        }]
      })
    });

    if (!createRes.ok) {
      const error = await createRes.json();
      return Response.json({ error: error.error.message }, { status: 400 });
    }

    const sheet = await createRes.json();
    const spreadsheet_id = sheet.spreadsheetId;
    const spreadsheet_url = `https://docs.google.com/spreadsheets/d/${spreadsheet_id}`;

    // Add headers
    const headerRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/'訂單'!A1:I1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [[
            '客戶姓名',
            '服務類型',
            '預約日期',
            '時段',
            '狀態',
            '地址',
            '指派管理師',
            '備註',
            '建立時間'
          ]]
        })
      }
    );

    if (!headerRes.ok) {
      const error = await headerRes.json();
      return Response.json({ error: error.error.message }, { status: 400 });
    }

    // Save metadata
    await base44.asServiceRole.system.setMetadata('google_sheet_config', {
      spreadsheet_id,
      spreadsheet_url,
      sheet_id: 0,
      created_at: new Date().toISOString()
    });

    return Response.json({ 
      spreadsheet_id,
      spreadsheet_url,
      sheet_id: 0
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});