import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SHEET_ID = '1lQc70QbKE0U_BvG7LNa_iR9AymWzO4y5g4SkDo0LtHY';

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

    // 獲取Google Sheets訪問令牌
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 映射預約數據到Sheet列 (A-X 共24列)
    const values = [
      '', // A: 編號 (auto-fill by user)
      '', // B: 清潔人員 (manual assign)
      '已報名', // C: 目前進度
      bookingData.client_name || '', // D: 姓名
      '', // E: 收款情況 (manual update)
      bookingData.phone || '', // F: 聯絡電話
      bookingData.address || '', // G: 需要服務地址
      bookingData.service_area || '', // H: 服務地區
      bookingData.housing_type || '', // I: 空間型態
      bookingData.square_footage || '', // J: 需求清潔坪數
      bookingData.has_pets ? '是' : '否', // K: 是否有寵物？
      bookingData.status || '日常清潔', // L: 目前狀態
      bookingData.service_type || '', // M: 想要的時長 × 次數 /訂閱制
      '', // N: 現場掃具 (manual input)
      '', // O: 您想申請的服務類型 (manual input)
      '', // P: 加強清潔 (manual input)
      bookingData.notes || '', // Q: 特殊需求 / 備注
      bookingData.scheduled_date || '', // R: 預計開始日期
      bookingData.time_slot || '', // S: 偏好時段
      '', // T: 偏好的星期（可複選）(manual input)
      '是', // U: 我已閱讀並同意以下條款
      '', // V: 您是從哪裡知道赫頌家事管理？ (manual input)
      bookingData.email || '', // W: 電子郵件地址
      new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) // X: 時間戳記
    ];

    // 先取得所有工作表信息
    const sheetsInfoResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!sheetsInfoResponse.ok) {
      throw new Error('Failed to get spreadsheet info');
    }

    const sheetsInfo = await sheetsInfoResponse.json();
    
    // 嘗試找到名稱包含「預約」或「清潔」的工作表，或使用第一個工作表
    let targetSheet = sheetsInfo.sheets?.find(sheet => 
      sheet.properties.title.includes('清潔') || sheet.properties.title.includes('預約')
    );
    
    if (!targetSheet) {
      // 如果沒找到，使用第一個工作表
      targetSheet = sheetsInfo.sheets?.[0];
    }
    
    if (!targetSheet) {
      throw new Error('No sheets found in spreadsheet');
    }
    
    console.log('Using sheet:', targetSheet.properties.title);

    const sheetId = targetSheet.properties.sheetId;

    // 使用 values:append 方法（自動処理列數）
    const sheetTitle = targetSheet.properties.title;
    const appendValuesResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${sheetTitle}':append`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [values],
          majorDimension: 'ROWS'
        }),
        params: { valueInputOption: 'RAW' }
      }
    );

    // 處理帶查詢參數的請求
    const appendValuesResponseWithParams = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${sheetTitle}':append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [values],
          majorDimension: 'ROWS'
        })
      }
    );

    if (!appendValuesResponseWithParams.ok) {
      const error = await appendValuesResponseWithParams.json();
      throw new Error(`Sheet API error: ${JSON.stringify(error)}`);
    }

    const appendData = await appendValuesResponseWithParams.json();

    // 記錄同步到 GoogleSheetLog
    try {
      await base44.entities.GoogleSheetLog.create({
        spreadsheet_id: SHEET_ID,
        spreadsheet_name: '清潔預約表',
        sheet_name: '清潔預約',
        operation_type: 'auto_sync',
        status: 'success',
        data_filled: {
          booking_id: bookingId,
          client_name: bookingData.client_name,
          service_type: bookingData.service_type,
          phone: bookingData.phone,
        },
        cells_affected: ['A:X'],
        notes: `自動同步預約 - ${bookingData.client_name}`,
      });
    } catch (logErr) {
      console.warn('Failed to log sync:', logErr);
    }

    return Response.json({
      success: true,
      message: 'Booking synced to sheet',
      sheetId: sheetId
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});