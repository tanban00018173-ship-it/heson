import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SPREADSHEET_ID = '1U0V5hXjrBo8Qh51vpPb6TfF2LOp05pKXTgtakz_YZvQ';
// 地址座標資料來源（syncBookingAddress 寫入的試算表）
const COORD_SPREADSHEET_ID = '1AgmwQLTTtslxU8Fn5GNdF9IjDAf4ih7ea5zmCUbuWWs';
const COORD_SHEET_NAME = '地址座標資料';

// 將欄位索引轉換為 A1 表示法
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

    // 1. 從「地址座標資料」表讀取所有地址→座標映射
    const coordRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${COORD_SPREADSHEET_ID}/values/${encodeURIComponent(COORD_SHEET_NAME + '!A:G')}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const coordData = await coordRes.json();
    const coordRows = coordData.values || [];

    // 建立地址→Maps連結的 map（標題行: A=預約ID, B=客戶姓名, C=服務類型, D=服務地址, E=緯度, F=經度, G=Google Maps連結）
    // 跳過標題列（第0行）
    const addressToLink = {};
    for (let i = 1; i < coordRows.length; i++) {
      const row = coordRows[i];
      const addr = (row[3] || '').trim();   // D欄：服務地址
      const lat  = (row[4] || '').trim();   // E欄：緯度
      const lng  = (row[5] || '').trim();   // F欄：經度
      const link = (row[6] || '').trim();   // G欄：Google Maps連結
      if (addr && lat && lng) {
        // 用座標生成連結（最準確）
        addressToLink[addr] = `https://www.google.com/maps?q=${lat},${lng}`;
      } else if (addr && link && link.startsWith('http')) {
        // 備用：直接用已有連結
        addressToLink[addr] = link;
      }
    }

    // 2. 取得目標試算表所有工作表
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const meta = await metaRes.json();
    const sheets = meta.sheets || [];

    const results = [];

    for (const sheet of sheets) {
      const sheetName = sheet.properties.title;

      // 3. 讀取標題列
      const headerRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName + '!1:1')}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const headerData = await headerRes.json();
      const headers = headerData.values?.[0] || [];

      // 找地址欄
      const addrColIdx = headers.findIndex(h =>
        typeof h === 'string' && (h.includes('地址') || h.includes('address'))
      );

      if (addrColIdx < 0) {
        results.push({ sheet: sheetName, skipped: true, reason: '找不到地址欄' });
        continue;
      }

      // 決定「地址連結」欄位置
      let linkColIdx = headers.findIndex(h =>
        typeof h === 'string' && (h.includes('地址連結') || h.includes('map') || h.toLowerCase().includes('maps'))
      );
      if (linkColIdx < 0) {
        linkColIdx = addrColIdx + 1;
      }

      const linkColLetter = colLetter(linkColIdx);
      const addrColLetter = colLetter(addrColIdx);

      // 若「地址連結」標題不存在，先寫入標題
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

      // 4. 讀取地址欄所有資料（從第2列開始）
      const dataRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName + '!' + addrColLetter + '2:' + addrColLetter + '2000')}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const addrRows = (await dataRes.json()).values || [];

      if (addrRows.length === 0) {
        results.push({ sheet: sheetName, skipped: true, reason: '無資料列' });
        continue;
      }

      // 5. 讀取現有連結欄（不覆蓋已有座標連結）
      const linkDataRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName + '!' + linkColLetter + '2:' + linkColLetter + '2000')}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const existingLinks = (await linkDataRes.json()).values || [];

      // 6. 產生連結：優先用座標查詢，找不到才用地址文字
      let filled = 0;
      const linkValues = addrRows.map((row, i) => {
        const addr = (row[0] || '').trim();
        const existing = (existingLinks[i]?.[0] || '').trim();

        if (!addr) return [''];

        // 已有座標連結（包含 ?q= 格式）就保留
        if (existing && existing.includes('maps?q=')) return [existing];

        // 從座標資料查找
        const coordLink = addressToLink[addr];
        if (coordLink) {
          filled++;
          return [coordLink];
        }

        // 找不到座標：保留已有連結，或留空（不再用地址文字反查）
        if (existing && existing.startsWith('http')) return [existing];
        return ['（無座標資料）'];
      });

      // 7. 批次寫入
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

      results.push({
        sheet: sheetName,
        addrCol: addrColLetter,
        linkCol: linkColLetter,
        filledWithCoords: filled,
        total: addrRows.length,
      });
    }

    return Response.json({ success: true, results });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});