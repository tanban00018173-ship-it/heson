import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.email !== 'mingus445606@gmail.com') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { message, bookings } = await req.json();

  const sheetSummary = bookings.map((b, i) => {
    return `[${i + 1}] ID:${b.id} | 客戶:${b.client_name || '無'} | 服務:${b.service_type || '無'} | 日期:${b.scheduled_date || '無'} | 時段:${b.time_slot || '無'} | 狀態:${b.status || '無'} | 地址:${b.address || '無'} | 管理師:${b.cleaner_name || '無'} | 備註:${b.notes || '無'}`;
  }).join('\n');

  const fullPrompt = `你是一個管理員內部試算表 AI 助理。你的職責：
1. 回答關於試算表資料的查詢問題
2. 接受批量或單個修改指令，並產生修改指令
3. 接受刪除指令，刪除不符合條件的資料

【試算表欄位說明】
- client_name: 客戶姓名
- service_type: 服務類型
- scheduled_date: 預約日期（格式 YYYY-MM-DD）
- time_slot: 時段
- status: 狀態（待確認、已確認、已完成、已取消）
- address: 地址
- cleaner_name: 指派管理師
- notes: 備註

【排序期間說明】
排序期間的命名格式為「期數_起始月/日-結束月/日」，例如「26_4/10-5/9」代表第26期，日期範圍為4月10日到5月9日。
當用戶提到某個排序期間時，需要根據該日期範圍來篩選 scheduled_date。

【試算表現有資料】
共 ${bookings.length} 筆記錄：
${sheetSummary || '（目前無資料）'}

【回覆規則】
- 若用戶查詢某資料，你必須從上方試算表中尋找，找不到時必須明說「找不到這份資料」，並列出可能相似的記錄供用戶確認
- 若問題本身可能有誤（例如日期格式錯誤、欄位名稱不存在），需引導用戶修正
- 若用戶要求修改，你必須在回覆的 mutations 陣列中提供修改指令
- mutations 格式：[{ "id": "預約ID", "fields": { "欄位名": "新值" } }]
- 若用戶要求刪除資料，你必須在回覆的 deletions 陣列中提供要刪除的預約 ID
- deletions 格式：["預約ID1", "預約ID2", ...]
- 若不需要修改或刪除，mutations 和 deletions 為空陣列
- 在刪除前，必須在 reply 中列出即將刪除的記錄摘要，讓管理員知道刪除了哪些資料
- 回覆語言：繁體中文

用戶指令：${message}`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: fullPrompt,
    response_json_schema: {
      type: "object",
      properties: {
        reply: { type: "string" },
        mutations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              fields: { type: "object" }
            }
          }
        },
        deletions: {
          type: "array",
          items: { type: "string" },
          description: "Array of booking IDs to delete"
        }
      },
      required: ["reply", "mutations", "deletions"]
    },
    model: "claude_sonnet_4_6"
  });

  return Response.json(result);
});