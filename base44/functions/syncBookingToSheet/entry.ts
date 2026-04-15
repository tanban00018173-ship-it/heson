import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SHEET_ID = '1lQc70QbKE0U_BvG7LNa_iR9AymWzO4y5g4SkDo0LtHY';
const SHEET_NAME = '表單回應 1'; // 默认的Google表单响应工作表名称

// 列映射 - 根据你的Google Sheet结构
const COLUMN_MAP = {
  'A': '編號',
  'B': '清潔人員',
  'C': '目前進度',
  'D': '姓名',
  'E': '收款情況',
  'F': '聯絡電話',
  'G': '需要服務地址',
  'H': '服務地區',
  'I': '空間型態',
  'J': '需求清潔坪數',
  'K': '是否有寵物？',
  'L': '目前狀態',
  'M': '想要的時長 × 次數 /訂閱制',
  'N': '現場掃具',
  'O': '您想申請的服務類型',
  'P': '加強清潔',
  'Q': '特殊需求 / 備注',
  'R': '預計開始日期',
  'S': '偏好時段',
  'T': '偏好的星期（可複選）',
  'U': '我已閱讀並同意以下條款',
  'V': '您是從哪裡知道赫頌家事管理？',
  'W': '電子郵件地址',
  'X': '時間戳記',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, bookingData } = body;

    if (!bookingId || !bookingData) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 获取Google Sheets访问令牌
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 准备要插入的数据行
    const values = [];
    for (let i = 0; i < 31; i++) {
      const col = String.fromCharCode(65 + i); // A-Z, AA-AE
      let value = '';

      // 根据列映射填充数据
      if (col === 'D') value = bookingData.client_name || '';
      else if (col === 'F') value = bookingData.phone || '';
      else if (col === 'G') value = bookingData.address || '';
      else if (col === 'H') value = bookingData.service_area || '';
      else if (col === 'I') value = bookingData.housing_type || '';
      else if (col === 'J') value = bookingData.square_footage || '';
      else if (col === 'K') value = bookingData.has_pets ? '是' : '否';
      else if (col === 'L') value = '待確認';
      else if (col === 'M') value = bookingData.service_type || '';
      else if (col === 'Q') value = bookingData.notes || '';
      else if (col === 'R') value = bookingData.scheduled_date || '';
      else if (col === 'S') value = bookingData.time_slot || '';
      else if (col === 'W') value = bookingData.email || '';
      else if (col === 'X') value = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

      values.push(value);
    }

    // 获取Sheet中的最后一行以找出插入位置
    const rangeResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A:A`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    const rangeData = await rangeResponse.json();
    const lastRow = (rangeData.values?.length || 1) + 1;
    const insertRange = `${SHEET_NAME}!A${lastRow}:AE${lastRow}`;

    // 插入数据到Google Sheets
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${insertRange}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [values]
        })
      }
    );

    if (!appendResponse.ok) {
      const error = await appendResponse.json();
      throw new Error(`Sheet API error: ${JSON.stringify(error)}`);
    }

    return Response.json({
      success: true,
      message: 'Booking synced to sheet',
      row: lastRow
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});