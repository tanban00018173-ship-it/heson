import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SPREADSHEET_ID = '1AgmwQLTTtslxU8Fn5GNdF9IjDAf4ih7ea5zmCUbuWWs';
const SHEET_NAME = '訂單資料';

// 映射 Booking 欄位到 Google Sheet 欄位
function mapBookingToSheetRow(booking, index) {
  return [
    index, // 編號
    booking.cleaner_name || '', // 清潔人員
    '', // 目前進度（保留給手動編輯）
    booking.client_name || '', // 姓名
    '', // 收款情況（保留給手動編輯）
    '', // 聯絡電話（保留給手動編輯）
    booking.address || '', // 需要服務地址
    '', // 服務地區（保留給手動編輯）
    '', // 空間型態（保留給手動編輯）
    '', // 需求清潔坪數（保留給手動編輯）
    '', // 是否有寵物（保留給手動編輯）
    '', // 目前狀態（保留給手動編輯）
    booking.service_type || '', // 想要的時長×次數/訂閱制
    '', // 現場掃具（保留給手動編輯）
    '', // 您想申請的服務類型（保留給手動編輯）
    '', // 加強清潔（保留給手動編輯）
    booking.notes || '', // 特殊需求/備注
    booking.scheduled_date || '', // 預計開始日期
    booking.time_slot || '', // 偏好時段
    '', // 偏好的星期（保留給手動編輯）
    '', // 我已閱讀並同意（保留給手動編輯）
    '', // 您是從哪裡知道赫頌家事管理（保留給手動編輯）
    '', // 電子郵件地址（保留給手動編輯）
    booking.created_date || '', // 時間戳記
  ];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 獲取所有 Booking 資料
    const bookings = await base44.entities.Booking.list('-created_date', 1000);
    
    if (bookings.length === 0) {
      return Response.json({ success: true, synced: 0 });
    }

    // 取得 Google Sheets 存取令牌
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 轉換資料為 Google Sheet 格式（跳過表頭行）
    const values = bookings.map((b, idx) => mapBookingToSheetRow(b, idx + 2));

    // 計算範圍：從第2行開始（跳過表頭）
    const range = `${SHEET_NAME}!A2:X${values.length + 1}`;

    // 更新 Google Sheet
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

    if (!response.ok) {
      const error = await response.json();
      return Response.json({ 
        error: 'Failed to sync to Google Sheets', 
        details: error 
      }, { status: 500 });
    }

    const result = await response.json();

    return Response.json({ 
      success: true, 
      synced: bookings.length,
      updatedCells: result.updatedCells,
      message: `已同步 ${bookings.length} 筆訂單到 Google Sheet`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});