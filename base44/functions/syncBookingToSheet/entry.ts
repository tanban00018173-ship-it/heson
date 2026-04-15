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

    // 映射預約數據到Sheet列（按照實際表頭對應）
    const values = [
      '', // A: 編號 (auto-fill by user)
      '', // B: 清潔人員 (manual assign)
      '', // C: 清掃時間 (manual input)
      bookingData.client_name || '', // D: 姓名
      bookingData.phone || '', // E: 電話
      bookingData.service_area || '', // F: 場址區域
      '', // G: 撥具數設 (manual input)
      bookingData.address || '', // H: 需要服務地址
      bookingData.housing_type || '', // I: 地址區銘/空間型態
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