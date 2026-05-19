import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 讀取座標資料表前5行
    const coordRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/1AgmwQLTTtslxU8Fn5GNdF9IjDAf4ih7ea5zmCUbuWWs/values/${encodeURIComponent('地址座標資料!A1:G5')}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const coordData = await coordRes.json();

    // 讀取排程表地址欄前5筆
    const schedRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/1U0V5hXjrBo8Qh51vpPb6TfF2LOp05pKXTgtakz_YZvQ/values/${encodeURIComponent('5\u6708\u6392\u5e8f\uff0826_5/10-6/9\uff09!H1:H5')}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const schedData = await schedRes.json();

    return Response.json({
      coord_table: coordData.values,
      schedule_addrs: schedData.values
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});