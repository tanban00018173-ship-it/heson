/**
 * 自動結案排程：服務完成24小時後，若無扣留則自動結案
 * 應設定為每30分鐘執行一次的排程任務
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: '需要管理員權限' }, { status: 403 });
  }

  const now = new Date();

  // 找出所有「待結算」且 auto_complete_at 已過期的訂單
  const pendingBookings = await base44.asServiceRole.entities.Booking.filter({ status: '待結算' });

  const toComplete = pendingBookings.filter(b => {
    if (!b.auto_complete_at) return false;
    return new Date(b.auto_complete_at) <= now;
  });

  let completed = 0;
  for (const booking of toComplete) {
    await base44.asServiceRole.entities.Booking.update(booking.id, {
      status: '已完成',
    });

    // 通知客戶服務已自動結案
    if (booking.client_id) {
      const users = await base44.asServiceRole.entities.User.filter({ id: booking.client_id });
      if (users[0]?.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: users[0].email,
          subject: '【HESON 赫頌】您的服務已完成結案',
          body: `您好 ${booking.client_name || ''},\n\n您的服務「${booking.service_type}」（日期：${booking.scheduled_date}）已自動結案完成。\n\n若有任何疑問，請聯繫 HESON 客服。\n\nHESON 赫頌家事管理平台 敬上`,
        });
      }
    }
    completed++;
  }

  return Response.json({
    success: true,
    processed: toComplete.length,
    completed,
    timestamp: now.toISOString(),
  });
});