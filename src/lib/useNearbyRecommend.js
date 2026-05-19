/**
 * useNearbyRecommend — 根據客戶地址 + 行為資料，排序推薦結果
 *
 * 演算法權重：
 *  1. 距離分 (40%) — 越近越高（需 gps_lat/lng）
 *  2. 地區匹配 (30%) — service_areas 包含用戶地區
 *  3. 熱門分 (20%) — click_count + booking_count * 3
 *  4. 排序值 (10%) — sort_order 越小越好
 */

const R = 6371; // 地球半徑 km

function haversine(lat1, lng1, lat2, lng2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * @param {Array} items — HomeSection 記錄陣列
 * @param {Object} userAddress — { gps_lat, gps_lng, district, city }
 * @returns sorted array
 */
export function sortByRelevance(items, userAddress) {
  if (!items?.length) return [];

  const userLat = userAddress?.gps_lat;
  const userLng = userAddress?.gps_lng;
  const userDistrict = userAddress?.district || '';
  const userCity = userAddress?.city || '';

  return [...items]
    .map((item) => {
      // 1. 距離分
      let distScore = 0;
      if (userLat && userLng && item.gps_lat && item.gps_lng) {
        const km = haversine(userLat, userLng, item.gps_lat, item.gps_lng);
        distScore = Math.max(0, 100 - km * 2); // 50km = 0分
      }

      // 2. 地區匹配分
      const areas = item.service_areas || [];
      const areaScore =
        areas.some((a) => a.includes(userDistrict) || userDistrict.includes(a))
          ? 100
          : areas.some((a) => a.includes(userCity) || userCity.includes(a))
          ? 60
          : 0;

      // 3. 熱門分
      const popularity = (item.click_count || 0) + (item.booking_count || 0) * 3;
      const hotScore = Math.min(100, popularity * 2);

      // 4. 排序值（sort_order 越小越前，轉成分數）
      const sortScore = Math.max(0, 100 - (item.sort_order || 99));

      const total =
        distScore * 0.4 +
        areaScore * 0.3 +
        hotScore * 0.2 +
        sortScore * 0.1;

      return { ...item, _score: total };
    })
    .sort((a, b) => b._score - a._score);
}