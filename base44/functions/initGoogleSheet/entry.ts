import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: '僅管理員可用' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 建立新試算表
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: { title: '清潔訂單管理' },
        sheets: [{
          properties: { sheetId: 0, title: '訂單' },
          data: [{
            rowData: [
              { values: [
                { userEnteredValue: { stringValue: '客戶' } },
                { userEnteredValue: { stringValue: '服務類型' } },
                { userEnteredValue: { stringValue: '日期' } },
                { userEnteredValue: { stringValue: '時段' } },
                { userEnteredValue: { stringValue: '狀態' } },
                { userEnteredValue: { stringValue: '地址' } },
                { userEnteredValue: { stringValue: '管理師' } },
                { userEnteredValue: { stringValue: '備註' } }
              ] }
            ]
          }]
        }]
      })
    });

    const sheet = await createRes.json();
    return Response.json({ spreadsheetId: sheet.spreadsheetId, url: `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});