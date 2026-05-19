/**
 * useTrack — 輕量行為追蹤 hook
 * 記錄用戶在首頁的每個點擊/瀏覽事件到 UserBehavior entity
 */
import { useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

// 產生或讀取 session ID
function getSessionId() {
  let sid = sessionStorage.getItem('_heson_sid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('_heson_sid', sid);
  }
  return sid;
}

export function useTrack(user, userAddress) {
  const sessionId = useRef(getSessionId());

  const track = useCallback(async (eventType, payload = {}) => {
    try {
      await base44.entities.UserBehavior.create({
        user_id: user?.id || null,
        session_id: sessionId.current,
        event_type: eventType,
        user_district: userAddress?.district || userAddress?.city || null,
        user_lat: userAddress?.gps_lat || null,
        user_lng: userAddress?.gps_lng || null,
        ...payload,
      });
    } catch {
      // 靜默失敗，不影響主流程
    }
  }, [user, userAddress]);

  return track;
}