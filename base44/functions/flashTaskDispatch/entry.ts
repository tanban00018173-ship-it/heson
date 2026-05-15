/**
 * 閃電任務自動派單引擎
 * - 掃描逾時未接單的閃電任務 (is_flash_task=true, status='待確認')
 * - 10 分鐘: 擴圈通知 5km
 * - 20 分鐘: 逾時 → expired + 退款通知
 * 
 * 此函數由 scheduled automation 每 5 分鐘呼叫一次
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: '需要管理員權限' }, { status: 403 });
  }

  const now = new Date();
  const expired = [];
  const expanded = [];

  // 取得所有待確認的閃電任務
  const flashTasks = await base44.asServiceRole.entities.Booking.filter({
    is_flash_task: true,
    status: '待確認',
  });

  for (const task of flashTasks) {
    if (!task.flash_expires_at) continue;

    const createdAt = new Date(task.created_date);
    const expireAt = new Date(task.flash_expires_at);
    const ageMs = now - createdAt;
    const ageMin = ageMs / 60000;

    // 已過期 (20 min)
    if (now >= expireAt) {
      await base44.asServiceRole.entities.Booking.update(task.id, {
        status: '已取消',
        notes: (task.notes || '') + ' [逾時無人接單，自動取消]',
      });

      // 通知客戶
      if (task.client_id) {
        const users = await base44.asServiceRole.entities.User.filter({ id: task.client_id });
        if (users[0]?.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: users[0].email,
            subject: '⚠️ 您的閃電任務無人接單',
            body: `您好，\n\n您於 ${task.created_date?.split('T')[0]} 發佈的「${task.service_type}」任務因 20 分鐘內無人接單已自動取消，款項將原路退回。\n\n💡 建議：您的報價可能低於市場行情，請試著提高 NT$50 重新發佈以加速媒合！\n\nHESON 赫頌 敬上`,
          });
        }
      }

      expired.push(task.id);
      continue;
    }

    // 10 分鐘後通知更多人 (擴圈 5km) – 以 notes 標記避免重複
    if (ageMin >= 10 && !task.notes?.includes('[已擴圈5km]')) {
      await base44.asServiceRole.entities.Booking.update(task.id, {
        notes: (task.notes || '') + ' [已擴圈5km]',
      });

      // 找 5km 內的在線人員並 Email 通知
      const cleaners = await base44.asServiceRole.entities.CleanerProfile.filter({ is_active: true });
      const nearby = task.gps_lat && task.gps_lng
        ? cleaners.filter(c => c.gps_lat && c.gps_lng && haversineKm(task.gps_lat, task.gps_lng, c.gps_lat, c.gps_lng) <= 5)
        : cleaners;

      for (const cleaner of nearby.slice(0, 20)) {
        if (!cleaner.user_id) continue;
        const cu = await base44.asServiceRole.entities.User.filter({ id: cleaner.user_id });
        if (cu[0]?.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: cu[0].email,
            subject: `⚡ 附近有閃電任務！${task.service_type} NT$${task.amount}`,
            body: `親愛的 ${cleaner.nickname}，\n\n附近有一個閃電任務等您接單！\n\n任務：${task.service_type}\n地點：${task.address}\n金額：NT$${task.amount}\n\n請開啟 HESON App 查看任務詳情。\n\nHESON 赫頌 敬上`,
          }).catch(() => {});
        }
      }

      expanded.push(task.id);
    }
  }

  return Response.json({
    success: true,
    processed: flashTasks.length,
    expired: expired.length,
    expanded: expanded.length,
    expired_ids: expired,
  });
});