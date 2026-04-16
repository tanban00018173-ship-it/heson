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
          return `[${i + 1}] ID:${b.id} | ${b.client_name || '無'} | ${b.service_type || '無'} | ${b.scheduled_date || '無'} | 狀態:${b.status || '無'}`;
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

    const systemPrompt = `你是赫頌家事管理系統的 AI 助理。用戶在內部試算表管理工具中與你對話。

【本地 Booking 資料（共 ${bookings.length} 筆）】
${bookingSummary}

【Google Sheet 資訊】
${sheetInfo}

【重要指令】
用戶可能要求你修改或填寫資料。如果用戶明確要求修改某筆資料，你應該在回應的最後加上以下格式的指令（用 JSON）：

\`\`\`json
{
  "mutations": [
    {
      "id": "booking_id",
      "fields": {
        "field_name": "new_value"
      }
    }
  ]
}
\`\`\`

例如，如果要把 ID 為 "abc123" 的狀態改成「已確認」：
\`\`\`json
{
  "mutations": [
    {
      "id": "abc123",
      "fields": {
        "status": "已確認"
      }
    }
  ]
}
\`\`\`

【你的角色】
- 回答用戶的任何問題
- 幫助分析或搜尋數據
- 當用戶要求修改時，解析要求並在回應中附加修改指令（JSON）
- 用繁體中文、友善且專業的語氣回覆

用戶訊息：${message}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt,
      model: 'gemini_3_flash'
    });

    // 嘗試從 LLM 回應中提取 JSON 指令
    const reply = result;
    let mutations = [];

    try {
      const jsonMatch = reply.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const parsed = JSON.parse(jsonStr);
        if (parsed.mutations && Array.isArray(parsed.mutations)) {
          mutations = parsed.mutations;
          console.log('Parsed mutations:', mutations);

          // 執行修改
          for (const m of mutations) {
            if (m.id && m.fields) {
              await base44.entities.Booking.update(m.id, m.fields);
              console.log('Updated booking:', m.id, m.fields);
            }
          }
        }
      }
    } catch (err) {
      console.log('No mutations found or JSON parse error:', err.message);
    }

    // 清理回應中的 JSON 塊（用戶不需要看到）
    const cleanReply = reply.replace(/```json\n?([\s\S]*?)\n?```/g, '').trim();

    return Response.json({
      reply: cleanReply,
      mutations: mutations.length > 0 ? mutations : undefined,
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