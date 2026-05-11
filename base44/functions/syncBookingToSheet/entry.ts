/**
 * syncBookingToSheet
 * 將訂單寫入「訂單資料庫」試算表（每個客戶/地址只寫一次）
 * 試算表 ID: 13vZMhKh0ljJB4oiD_6I-ccYeO33xAevHHaIGUSaDy50
 * 子工作表: R／定清, H／民宿, L／輕量, D／細清, P／毛坯
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DB_SHEET_ID = '13vZMhKh0ljJB4oiD_6I-ccYeO33xAevHHaIGUSaDy50';

// 服務類型 → 子工作表前綴 & 名稱
function resolveSheetPrefix(serviceType, businessType) {
  const s = (serviceType || '').toLowerCase();
  const b = (businessType || '').toLowerCase();

  if (s.includes('民宿')) return { prefix: 'H', sheetName: 'H／民宿' };
  if (s.includes('裝潢') || s.includes('毛坯')) return { prefix: 'P', sheetName: 'P／毛坯' };
  if (s.includes('大掃除') || b.includes('廠商') || b.includes('直營')) return { prefix: 'D', sheetName: 'D／細清' };
  if (s.includes('定期') || s.includes('月護') || s.includes('月安') || s.includes('月綻') ||
      s.includes('4次') || s.includes('8次') || s.includes('12次')) return { prefix: 'R', sheetName: 'R／定清' };
  return { prefix: 'L', sheetName: 'L／輕量' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { bookingId, bookingData } = body;
    if (!bookingId || !bookingData) {
      return Response.json({ error: 'Missing bookingId or bookingData' }, { status: 400 });
    }

    // 若已建檔，跳過
    if (bookingData.db_synced) {
      return Response.json({ success: true, skipped: true, reason: '已建檔，跳過' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    const { prefix, sheetName } = resolveSheetPrefix(bookingData.service_type, bookingData.business_type);

    // 取得試算表 sheet 資訊
    const infoRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${DB_SHEET_ID}?fields=sheets.properties`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!infoRes.ok) throw new Error(`取得試算表資訊失敗: ${await infoRes.text()}`);
    const info = await infoRes.json();
    const allSheets = info.sheets || [];

    const targetSheet = allSheets.find(s => s.properties.title === sheetName);
    if (!targetSheet) {
      const available = allSheets.map(s => s.properties.title).join(', ');
      throw new Error(`找不到工作表 "${sheetName}"。可用: ${available}`);
    }
    const sheetNumericId = targetSheet.properties.sheetId;

    // 計算此分類的下一個流水號
    const dataRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${DB_SHEET_ID}/values/${encodeURIComponent(sheetName)}!A:A`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const dataJson = await dataRes.json();
    const existingRows = (dataJson.values || []).length;
    // 第1行是標題，所以流水號 = existingRows（已有資料行數，不含標題）
    const seqNumber = existingRows > 0 ? existingRows : 1;
    const dbCode = `${prefix}${seqNumber}`;

    // 組裝欄位（對應資料庫試算表格式）
    // A:編號, B:客戶姓名, C:電話, D:服務地址, E:空間型態, F:坪數,
    // G:服務類型, H:業務類型, I:偏好時段, J:加強清潔, K:偏好星期,
    // L:備註, M:得知來源, N:推薦人, O:訂閱方案/次數, P:建檔日期, Q:訂單ID
    const rowValues = [
      dbCode,                                                    // A: 編號
      bookingData.client_name || '',                             // B: 客戶姓名
      bookingData.phone || '',                                   // C: 電話
      bookingData.address || '',                                 // D: 服務地址
      bookingData.housing_type || '',                            // E: 空間型態
      String(bookingData.square_footage || ''),                  // F: 坪數
      bookingData.service_type || '',                            // G: 服務類型
      bookingData.business_type || '平台派案',                   // H: 業務類型
      bookingData.time_slot || '',                               // I: 偏好時段
      Array.isArray(bookingData.enhance_areas)
        ? bookingData.enhance_areas.join(', ')
        : (bookingData.enhance_areas || ''),                    // J: 加強清潔
      Array.isArray(bookingData.preferred_weekdays)
        ? bookingData.preferred_weekdays.join(', ')
        : (bookingData.preferred_weekdays || ''),               // K: 偏好星期
      bookingData.notes || '',                                   // L: 備註
      bookingData.referral_source || '',                         // M: 得知來源
      bookingData.referrer || '',                                // N: 推薦人
      bookingData.service_area || '',                            // O: 場勘區域
      new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }), // P: 建檔日期
      bookingId,                                                 // Q: 訂單ID
    ];

    // 寫入試算表
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${DB_SHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            appendCells: {
              sheetId: sheetNumericId,
              rows: [{ values: rowValues.map(v => ({ userEnteredValue: { stringValue: String(v) } })) }],
              fields: 'userEnteredValue'
            }
          }]
        })
      }
    );
    if (!appendRes.ok) throw new Error(`寫入失敗: ${JSON.stringify(await appendRes.json())}`);

    // 回寫 db_sheet_code 與 db_synced 到 Booking entity
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      db_sheet_code: dbCode,
      db_synced: true,
    });

    // 記錄 log
    try {
      await base44.asServiceRole.entities.GoogleSheetLog.create({
        spreadsheet_id: DB_SHEET_ID,
        spreadsheet_name: '訂單資料庫',
        sheet_name: sheetName,
        operation_type: 'ai_fill',
        status: 'success',
        data_filled: { booking_id: bookingId, db_code: dbCode, client_name: bookingData.client_name },
        notes: `客戶建檔 ${dbCode} → ${sheetName}`,
      });
    } catch (_) { /* log 失敗不影響主流程 */ }

    return Response.json({ success: true, db_code: dbCode, sheet: sheetName });
  } catch (error) {
    console.error('syncBookingToSheet error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});