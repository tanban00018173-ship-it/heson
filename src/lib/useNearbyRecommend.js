const R = 6371;

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

export function sortByRelevance(items, userAddress) {
  if (!items?.length) return [];

  const userLat = userAddress?.gps_lat;
  const userLng = userAddress?.gps_lng;
  const userDistrict = userAddress?.district || '';
  const userCity = userAddress?.city || '';

  return [...items]
    .map((item) => {
      let distScore = 0;
      if (userLat && userLng && item.gps_lat && item.gps_lng) {
        const km = haversine(userLat, userLng, item.gps_lat, item.gps_lng);
        distScore = Math.max(0, 100 - km * 2);
      }

      const areas = item.service_areas || [];
      const areaScore =
        areas.some((a) => a.includes(userDistrict) || userDistrict.includes(a))
          ? 100
          : areas.some((a) => a.includes(userCity) || userCity.includes(a))
          ? 60
          : 0;

      const popularity = (item.click_count || 0) + (item.booking_count || 0) * 3;
      const hotScore = Math.min(100, popularity * 2);
      const sortScore = Math.max(0, 100 - (item.sort_order || 99));

      const total = distScore * 0.4 + areaScore * 0.3 + hotScore * 0.2 + sortScore * 0.1;
      return { ...item, _score: total };
    })
    .sort((a, b) => b._score - a._score);
}