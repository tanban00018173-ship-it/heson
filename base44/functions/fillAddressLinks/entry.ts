import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SPREADSHEET_ID = '1U0V5hXjrBo8Qh51vpPb6TfF2LOp05pKXTgtakz_YZvQ';

// 將欄位索引轉換為 A1 表示法（0→A, 1→B, 26→AA ...）
function colLetter(idx) {
  let s = '';
  let n = idx + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 1. 取得試算表所有工作表名稱
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const meta = await metaRes.json();
    const sheets = meta.sheets || [];

    const results = [];

    for (const sheet of sheets) {
      const sheetName = sheet.properties.title;

      // 2. 讀取第1列（標題）
      const headerRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName + '!1:1')}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const headerData = await headerRes.json();
      const headers = headerData.values?.[0] || [];

      // 3. 找「地址」欄（包含「地址」、「需要服務地址」等關鍵字）
      const addrColIdx = headers.findIndex(h =>
        typeof h === 'string' && (h.includes('地址') || h.includes('address'))
      );

      if (addrColIdx < 0) {
        results.push({ sheet: sheetName, skipped: true, reason: '找不到地址欄' });
        continue;
      }

      // 4. 決定「地址連結」欄：看看標題列有沒有已存在的「地址連結」欄
      let linkColIdx = headers.findIndex(h =>
        typeof h === 'string' && (h.includes('地址連結') || h.includes('map') || h.toLowerCase().includes('maps'))
      );

      // 若沒有則放在地址欄的下一欄
      if (linkColIdx < 0) {
        linkColIdx = addrColIdx + 1;
      }

      const linkColLetter = colLetter(linkColIdx);
      const addrColLetter = colLetter(addrColIdx);

      // 5. 若「地址連結」標題不存在，先寫入標題
      if (!headers[linkColIdx] || !headers[linkColIdx].includes('地址連結')) {
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName + '!' + linkColLetter + '1')}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [['地址連結']] })
          }
        );
      }

      // 6. 讀取地址欄所有資料（從第2列開始）
      const dataRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName + '!' + addrColLetter + '2:' + addrColLetter + '2000')}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const dataData = await dataRes.json();
      const addrRows = dataData.values || [];

      if (addrRows.length === 0) {
        results.push({ sheet: sheetName, skipped: true, reason: '無資料列' });
        continue;
      }

      // 7. 讀取現有的地址連結欄（避免覆蓋已有的）
      const linkDataRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName + '!' + linkColLetter + '2:' + linkColLetter + '2000')}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const linkData = await linkDataRes.json();
      const existingLinks = linkData.values || [];

      // 8. 建立要寫入的連結值（只處理有地址但連結是空的列）
      const linkValues = addrRows.map((row, i) => {
        const addr = (row[0] || '').trim();
        const existing = (existingLinks[i]?.[0] || '').trim();
        if (!addr) return [''];
        if (existing && existing.startsWith('http')) return [existing]; // 已有連結，保留
        return [`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`];
      });

      // 9. 批次寫入
      const writeRange = `${sheetName}!${linkColLetter}2:${linkColLetter}${addrRows.length + 1}`;
      const writeRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(writeRange)}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: linkValues })
        }
      );

      if (!writeRes.ok) {
        const err = await writeRes.json();
        results.push({ sheet: sheetName, error: err?.error?.message });
        continue;
      }

      const filled = linkValues.filter(v => v[0]?.startsWith('http')).length;
      results.push({
        sheet: sheetName,
        addrCol: addrColLetter,
        linkCol: linkColLetter,
        filled,
        total: addrRows.length,
      });
    }

    return Response.json({ success: true, results });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});