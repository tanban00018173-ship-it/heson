/**
 * syncBookingToGoogleSheet
 * 將每次服務紀錄寫入「月曆排程表」（每筆訂單服務一行，按日期排序）
 * 試算表 ID: 16maE0NfEjVa1Drj5RfQGjWWM6qR--npTsY7H7_bO7FY
 *
 * 欄位：
 * A:日期, B:星期, C:時段, D:編號(db_sheet_code), E:客戶姓名, F:服務地址,
 * G:服務類型, H:業務類型, I:清潔師, J:訂單金額(進帳), K:支出, L:平台利潤,
 * M:付款狀態, N:訂單狀態, O:備註, P:訂單ID
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CALENDAR_SHEET_ID = '16maE0NfEjVa1Drj5RfQGjWWM6qR--npTsY7H7_bO7FY';
const CALENDAR_SHEET_NAME = '月曆排程';

const WEEKDAY_ZH = ['日', '一', '二', '三', '四', '五', '六'];

function calcExpense(amount, businessType, serviceType) {
  if (!amount) return { expense: '', profit: '' };
  const amt = Number(amount);
  const b = (businessType || '平台派案');
  const s = (serviceType || '').toLowerCase();

  if (b === '赫頌直營') {
    // 直營：固定薪水另計，此欄填「固定薪」
    return { expense: '固定薪', profit: String(amt) };
  }
  if (b === '赫頌廠商' || s.includes('大掃除') || s.includes('裝潢') || s.includes('毛坯')) {
    // 廠商：80% 給廠商，平台抽 20%
    return {
      expense: String(Math.round(amt * 0.8)),
      profit: String(Math.round(amt * 0.2))
    };
  }
  // 平台派案（師傅/小幫手）：70% 給員工，平台抽 30%
  return {
    expense: String(Math.round(amt * 0.7)),
    profit: String(Math.round(amt * 0.3))
  };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = WEEKDAY_ZH[d.getDay()];
  return `${m}/${day}(${wd})`;
}

function formatTimeSlot(timeSlot) {
  // "上午 08:00-12:00" → "08:00-12:00"
  return (timeSlot || '').replace(/^(上午|下午|晚間)\s*/, '');
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

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 取得試算表 sheet 資訊，找到月曆排程的 sheetId
    const infoRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${CALENDAR_SHEET_ID}?fields=sheets.properties`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!infoRes.ok) throw new Error(`取得試算表資訊失敗: ${await infoRes.text()}`);
    const info = await infoRes.json();
    const allSheets = info.sheets || [];

    const targetSheet = allSheets.find(s => s.properties.title === CALENDAR_SHEET_NAME);
    if (!targetSheet) {
      const available = allSheets.map(s => s.properties.title).join(', ');
      throw new Error(`找不到工作表 "${CALENDAR_SHEET_NAME}"。可用: ${available}`);
    }
    const sheetNumericId = targetSheet.properties.sheetId;

    // 計算支出與利潤
    const { expense, profit } = calcExpense(
      bookingData.amount,
      bookingData.business_type,
      bookingData.service_type
    );

    // 組裝欄位
    const rowValues = [
      formatDate(bookingData.scheduled_date),                    // A: 日期（含星期）
      '',                                                        // B: 清掃時間（手動填或另計）
      formatTimeSlot(bookingData.time_slot),                     // C: 時段
      bookingData.db_sheet_code || '',                           // D: 編號（如 R1, H5）
      bookingData.client_name || '',                             // E: 客戶姓名
      bookingData.address || '',                                 // F: 服務地址
      bookingData.service_type || '',                            // G: 服務類型
      bookingData.business_type || '平台派案',                   // H: 業務類型
      bookingData.cleaner_name || '',                            // I: 清潔師
      bookingData.amount ? String(bookingData.amount) : '',      // J: 進帳（訂單金額）
      expense,                                                   // K: 支出
      profit,                                                    // L: 平台利潤
      bookingData.payment_status || '待付款',                    // M: 付款狀態
      bookingData.status || '',                                  // N: 訂單狀態
      bookingData.notes || '',                                   // O: 備註
      bookingId,                                                 // P: 訂單ID
    ];

    // 寫入試算表
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${CALENDAR_SHEET_ID}:batchUpdate`,
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

    // 記錄 log
    try {
      await base44.asServiceRole.entities.GoogleSheetLog.create({
        spreadsheet_id: CALENDAR_SHEET_ID,
        spreadsheet_name: '月曆排程表',
        sheet_name: CALENDAR_SHEET_NAME,
        operation_type: 'ai_fill',
        status: 'success',
        data_filled: {
          booking_id: bookingId,
          date: bookingData.scheduled_date,
          client_name: bookingData.client_name,
          amount: bookingData.amount,
          expense,
          profit,
        },
        notes: `服務排程寫入 ${formatDate(bookingData.scheduled_date)} ${bookingData.client_name}`,
      });
    } catch (_) { /* log 失敗不影響主流程 */ }

    return Response.json({ success: true, expense, profit });
  } catch (error) {
    console.error('syncBookingToGoogleSheet error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});