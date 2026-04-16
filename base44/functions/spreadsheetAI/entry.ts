import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SPREADSHEET_ID = '1AgmwQLTTtslxU8Fn5GNdF9IjDAf4ih7ea5zmCUbuWWs';
const SHEET_NAME = '訂單資料';

async function getGoogleSheetData(accessToken) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error('Failed to fetch Google Sheet');
  const data = await response.json();
  return data.values || [];
}

async function updateGoogleSheet(accessToken, range, values) {
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
  if (!response.ok) throw new Error('Failed to update Google Sheet');
  return await response.json();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { message, bookings } = await req.json();
  
  // 獲取 Google Sheets 存取令牌
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
  
  // 取得 Google Sheet 當前資料
  let sheetData = [];
  try {
    sheetData = await getGoogleSheetData(accessToken);
  } catch (err) {
    console.error('Failed to fetch sheet data:', err.message);
  }

  const sheetSummary = bookings.map((b, i) => {
    return `[${i + 1}] ID:${b.id} | 客戶:${b.client_name || '無'} | 服務:${b.service_type || '無'} | 日期:${b.scheduled_date || '無'} | 時段:${b.time_slot || '無'} | 狀態:${b.status || '無'} | 地址:${b.address || '無'} | 管理師:${b.cleaner_name || '無'} | 備註:${b.notes || '無'}`;
  }).join('\n');

  // Google Sheet 欄位對應
  const SHEET_COLUMNS = {
    0: '編號',
    1: '清潔人員',
    2: '目前進度',
    3: '姓名',
    4: '收款情況',
    5: '聯絡電話',
    6: '需要服務地址',
    7: '服務地區',
    8: '空間型態',
    9: '需求清潔坪數',
    10: '是否有寵物',
    11: '目前狀態',
    12: '想要的時長×次數',
    13: '現場掃具',
    14: '您想申請的服務類型',
    15: '加強清潔',
    16: '特殊需求/備注',
    17: '預計開始日期',
    18: '偏好時段',
    19: '偏好的星期',
    20: '我已閱讀並同意',
    21: '您是從哪裡知道赫頌',
    22: '電子郵件地址',
    23: '時間戳記',
  };

  const sheetSummaryStr = sheetData.slice(1).map((row, i) => {
    return `[${i + 1}] ${Object.values(SHEET_COLUMNS).slice(0, row.length).map((col, idx) => `${col}:${row[idx] || '無'}`).join(' | ')}`;
  }).join('\n');

  const fullPrompt = `你是一個管理員內部試算表 AI 助理，可直接修改 Google Sheet 資料。你的職責：
1. 回答關於試算表資料的查詢問題
2. 接受用戶指令，修改或新增 Google Sheet 中的資料列
3. 支援日期篩選與資料刪除操作

【Google Sheet 現有資料】
共 ${sheetData.length - 1} 筆記錄（不含表頭）：
${sheetSummaryStr || '（目前無資料）'}

【回覆規則】
- 若用戶要求修改 Google Sheet 資料，提供 sheet_updates 陣列，格式如下：
  [{ "range": "訂單資料!A2:X2", "values": [[編號, 清潔人員, 目前進度, ...]] }]
- 新增資料列時，計算正確的範圍（如第 5 列就是 A5:X5）
- 每個 update 包含 range 和 values 兩個欄位
- values 是二維陣列，每個內部陣列代表一列
- 若不需要修改 Sheet，sheet_updates 為空陣列
- 同時回覆 reply（用繁體中文）說明做了什麼修改
- 對用戶的查詢進行詳細回答

用戶指令：${message}`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: fullPrompt,
    response_json_schema: {
      type: "object",
      properties: {
        reply: { type: "string" },
        sheet_updates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              range: { type: "string" },
              values: { type: "array" }
            },
            required: ["range", "values"]
          }
        }
      },
      required: ["reply", "sheet_updates"]
    },
    model: "claude_sonnet_4_6"
  });

  // 執行 Google Sheet 更新
  if (result.sheet_updates && result.sheet_updates.length > 0) {
    try {
      for (const update of result.sheet_updates) {
        await updateGoogleSheet(accessToken, update.range, update.values);
      }
      return Response.json({
        reply: result.reply,
        sheet_updates_applied: result.sheet_updates.length,
        success: true
      });
    } catch (err) {
      return Response.json({
        reply: result.reply + `\n\n⚠️ Google Sheet 更新失敗: ${err.message}`,
        success: false
      }, { status: 500 });
    }
  }

  return Response.json({ 
    reply: result.reply,
    sheet_updates_applied: 0,
    success: true
  });
  });