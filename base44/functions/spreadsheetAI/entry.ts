import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SPREADSHEET_ID = '1AgmwQLTTtslxU8Fn5GNdF9IjDAf4ih7ea5zmCUbuWWs';
const SHEET_NAME = '訂單資料';

// 從 Google Sheet 讀取資料
async function readGoogleSheet(accessToken) {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}?majorDimension=ROWS`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.values || [];
  } catch (err) {
    console.error('Failed to read Google Sheet:', err.message);
    return null;
  }
}

// 寫入 Google Sheet
async function writeGoogleSheet(accessToken, range, values) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );
  if (!response.ok) throw new Error('Failed to write to Google Sheet');
  return await response.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { message, bookings } = await req.json();

    // 獲取 Google Sheets 存取令牌
    let accessToken = null;
    let sheetData = null;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlesheets');
      accessToken = conn.accessToken;
      sheetData = await readGoogleSheet(accessToken);
    } catch (err) {
      console.error('Failed to access Google Sheets:', err.message);
    }

    // 準備本地資料摘要（來自 Booking 實體）
    const bookingSummary = bookings.map((b, i) => {
      return `[${i + 1}] 客戶:${b.client_name || '無'} | 服務:${b.service_type || '無'} | 日期:${b.scheduled_date || '無'} | 時段:${b.time_slot || '無'} | 狀態:${b.status || '無'}`;
    }).join('\n');

    // 準備 Sheet 資料摘要（如果有讀取到）
    const sheetSummary = sheetData && sheetData.length > 1 
      ? `Google Sheet 中共有 ${sheetData.length - 1} 列資料（含表頭）`
      : '無法讀取 Google Sheet';

    const prompt = `你是赫頌家事管理系統的內部 AI 助理。用戶正在使用內部試算表管理工具。

【目前資料】
本地 Booking 資料：共 ${bookings.length} 筆
${bookingSummary || '（目前無資料）'}

Google Sheet 狀態：${sheetSummary}

【你的職責】
1. 回答用戶關於資料的任何問題
2. 幫助用戶分析或搜尋資料
3. 提供建議和說明

【重要】
- 使用繁體中文回覆
- 保持友善和專業的語氣
- 如果用戶要求修改資料，告訴他們修改方法

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
      success: false,
      error: err.message
    }, { status: 500 });
  }
});