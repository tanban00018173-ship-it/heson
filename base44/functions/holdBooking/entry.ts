/**
 * 扣留訂單：客戶可在「待結算」期間觸發扣留
 * payload: { bookingId, reason, hold_status: "限期補正" | "退款處理中", refund_percent: 0|20|50|100 }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: '請先登入' }, { status: 401 });
  }

  const { bookingId, reason, hold_status, refund_percent } = await req.json();

  if (!bookingId || !reason || !hold_status) {
    return Response.json({ error: '缺少必要參數' }, { status: 400 });
  }

  // 確認此預約屬於此客戶
  const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
  const booking = bookings[0];
  if (!booking) {
    return Response.json({ error: '找不到預約' }, { status: 404 });
  }

  // 只有客戶本人或 admin 可以扣留
  if (booking.client_id !== user.id && user.role !== 'admin') {
    return Response.json({ error: '無權限操作' }, { status: 403 });
  }

  // 只有「待結算」或「已確認」的訂單可以扣留
  if (!['待結算', '已確認', '進行中'].includes(booking.status)) {
    return Response.json({ error: `狀態「${booking.status}」的訂單無法扣留` }, { status: 400 });
  }

  await base44.asServiceRole.entities.Booking.update(bookingId, {
    status: '扣留中',
    hold_status,
    hold_reason: reason,
    hold_refund_percent: refund_percent ?? 0,
  });

  // 通知管理員
  await base44.asServiceRole.integrations.Core.SendEmail({
    to: 'larry87tw@gmail.com',
    subject: `【HESON】訂單扣留通知 - ${booking.client_name}`,
    body: `客戶「${booking.client_name}」已觸發訂單扣留。\n\n預約ID: ${bookingId}\n服務類型: ${booking.service_type}\n服務日期: ${booking.scheduled_date}\n\n扣留類型: ${hold_status}\n退款比例: ${refund_percent ?? 0}%\n原因: ${reason}\n\n請儘速處理。\n\nHESON 系統通知`,
  });

  return Response.json({ success: true, message: '已提交扣留申請，管理員將盡速處理' });
});