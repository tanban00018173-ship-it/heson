import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SPREADSHEET_ID = '1AgmwQLTTtslxU8Fn5GNdF9IjDAf4ih7ea5zmCUbuWWs';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { message, bookings } = await req.json();

    // 準備本地資料摘要
    const bookingSummary = bookings.length > 0
      ? bookings.map((b, i) => {
          return `[${i + 1}] ${b.client_name || '無'} | ${b.service_type || '無'} | ${b.scheduled_date || '無'} | ${b.status || '無'}`;
        }).join('\n')
      : '目前無本地資料';

    // 簡單版：嘗試讀取 Google Sheet 的基本信息
    let sheetInfo = 'Google Sheet 資料（讀取中...）';
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlesheets');
      const accessToken = conn.accessToken;
      
      // 只讀取 sheet 名稱和列數，不讀取全部數據
      const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets(properties(title,sheetId),data(rowData(values(userEnteredValue))))`;
      const metaRes = await fetch(metaUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        const sheets = metaData.sheets || [];
        const sheetTitles = sheets.map(s => s.properties?.title).join(', ');
        const rowCounts = sheets.map(s => s.data?.[0]?.rowData?.length || 0).join(', ');
        sheetInfo = `Google Sheet 包含 ${sheets.length} 個工作表：${sheetTitles}，各表列數：${rowCounts}`;
      }
    } catch (err) {
      console.error('Google Sheets 讀取失敗:', err.message);
      sheetInfo = 'Google Sheet 暫時無法讀取';
    }

    const prompt = `你是赫頌家事管理系統的 AI 助理。用戶在內部試算表管理工具中與你對話。

【本地 Booking 資料（共 ${bookings.length} 筆）】
${bookingSummary}

【Google Sheet 資訊】
${sheetInfo}

【你的角色】
- 回答用戶的任何問題
- 幫助分析或搜尋數據
- 用繁體中文、友善且專業的語氣回覆

用戶訊息：${message}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      model: 'gemini_3_flash'
    });

    return Response.json({
      reply: result,
      success: true
    });
  } catch (err) {
    console.error('Function error:', err.message);
    return Response.json({
      reply: '❌ 發生錯誤，請稍後再試。',
      success: false
    }, { status: 500 });
  }
});