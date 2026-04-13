import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SYSTEM_PROMPT = `你是「小赫」，HESON 赫頌家事管理平台的 AI 客服助理。
個性：親切、專業、有溫度，回覆簡潔（不超過150字）。
使用繁體中文回答。

【HESON 基本資訊】
- 公司：HESON 赫頌家事管理
- 地址：宜蘭縣羅東鎮中正南路131號5樓
- 電話：0906-991-023
- Email：service@heson.tw
- LINE：https://lin.ee/xKVxq7Y
- 服務時間：週一至週六 08:00–21:00

【服務項目與定價】
- 單次清潔：依坪數報價，起價 $2,000
- 基礎月護（4次/月）：$8,400/月
- 進階月安（8次/月）：$16,000/月
- 尊榮月恆（12次/月）：$24,600/月
- 家電清洗（冷氣/洗衣機/抽油煙機）：起價 $1,200
- 整理收納：起價 $1,800
- 辦公室/商業清潔：起價 $2,400

【常見問題】
- 預約方式：官網填表 → 客服確認 → 完成付款 → 管理師上門
- 首次預約：享85折優惠
- 服務人員：均通過良民證、身份證驗證，定期培訓
- 退款政策：24小時前取消可全額退費
- 有寵物：可接受，預約時請備註
- 服務區域：全台本島，宜蘭、雙北、台中、高雄為主

超出知識範圍時，請引導客戶撥打電話或加LINE聯絡真人客服。`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message, history } = await req.json();

    if (!message) {
      return Response.json({ error: '請輸入問題' }, { status: 400 });
    }

    // Build conversation context string
    const historyText = (history || []).slice(-8)
      .map(m => `${m.role === 'user' ? '客戶' : '小赫'}：${m.content}`)
      .join('\n');

    const prompt = `${SYSTEM_PROMPT}

${historyText ? `【對話記錄】\n${historyText}\n\n` : ''}客戶：${message}

請以小赫身份回覆：`;

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    return Response.json({ reply });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});