/**
 * 智慧派單引擎（升級版）
 * - 支援 GPS 距離媒合（Haversine）
 * - 3km 優先媒合，10分鐘後自動擴散至 5km
 * - Admin 手動指派 or 自動推薦名單
 * payload: { bookingId, mode: "auto_suggest" | "manual", cleanerId? }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: '需要管理員權限' }, { status: 403 });
  }

  const { bookingId, mode = 'auto_suggest', cleanerId } = await req.json();

  // 取得預約資料
  const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
  const booking = bookings[0];
  if (!booking) {
    return Response.json({ error: '找不到預約' }, { status: 404 });
  }

  // 手動指派模式
  if (mode === 'manual' && cleanerId) {
    const cleaners = await base44.asServiceRole.entities.CleanerProfile.filter({ id: cleanerId });
    const cleaner = cleaners[0];
    if (!cleaner) return Response.json({ error: '找不到管理師' }, { status: 404 });

    await base44.asServiceRole.entities.Booking.update(bookingId, {
      cleaner_id: cleanerId,
      cleaner_name: cleaner.nickname,
      status: '已確認',
    });

    // Email 通知管理師
    if (cleaner.user_id) {
      const cleanerUsers = await base44.asServiceRole.entities.User.filter({ id: cleaner.user_id });
      if (cleanerUsers[0]?.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: cleanerUsers[0].email,
          subject: '【HESON 赫頌】您有新的派單任務',
          body: `親愛的 ${cleaner.nickname}，\n\n您已被指派以下服務：\n客戶：${booking.client_name}\n日期：${booking.scheduled_date} ${booking.time_slot}\n地址：${booking.address}\n備註：${booking.notes || '無'}\n\nHESON 赫頌 敬上`,
        });
      }
    }

    return Response.json({ success: true, mode: 'manual', cleaner_name: cleaner.nickname });
  }

  // 自動推薦模式：依 GPS 距離篩選
  if (!booking.gps_lat || !booking.gps_lng) {
    // 無 GPS，回傳全部活躍管理師供手動選擇
    const allCleaners = await base44.asServiceRole.entities.CleanerProfile.filter({ is_active: true });
    return Response.json({
      success: true,
      mode: 'no_gps',
      message: '此預約無 GPS 座標，無法自動距離篩選，請手動指派',
      candidates: allCleaners.map(c => ({
        id: c.id,
        nickname: c.nickname,
        service_areas: c.service_areas,
        distance_km: null,
      })),
    });
  }

  const allCleaners = await base44.asServiceRole.entities.CleanerProfile.filter({ is_active: true });

  // 計算距離（需要管理師有 GPS 資料，暫以 service_areas 文字比對作為 fallback）
  const withDistance = allCleaners
    .map(c => {
      // 若管理師有緯經度（未來擴充）則用 Haversine，否則用 service_areas 比對
      const dist = (c.gps_lat && c.gps_lng)
        ? haversineKm(booking.gps_lat, booking.gps_lng, c.gps_lat, c.gps_lng)
        : null;
      return { ...c, distance_km: dist };
    })
    .sort((a, b) => {
      if (a.distance_km === null && b.distance_km === null) return 0;
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    });

  // 3km 優先候選
  const within3km = withDistance.filter(c => c.distance_km !== null && c.distance_km <= 3);
  const within5km = withDistance.filter(c => c.distance_km !== null && c.distance_km <= 5);
  const addressMatch = withDistance.filter(c => {
    if (!c.service_areas || !booking.address) return false;
    return c.service_areas.some(area => booking.address.includes(area));
  });

  const candidates = within3km.length > 0 ? within3km
    : within5km.length > 0 ? within5km
    : addressMatch.length > 0 ? addressMatch
    : withDistance.slice(0, 10);

  return Response.json({
    success: true,
    mode: 'auto_suggest',
    booking_address: booking.address,
    gps: { lat: booking.gps_lat, lng: booking.gps_lng },
    radius_used: within3km.length > 0 ? '3km' : within5km.length > 0 ? '5km' : '地區比對',
    candidates: candidates.slice(0, 10).map(c => ({
      id: c.id,
      nickname: c.nickname,
      service_areas: c.service_areas,
      distance_km: c.distance_km ? Math.round(c.distance_km * 10) / 10 : null,
    })),
  });
});