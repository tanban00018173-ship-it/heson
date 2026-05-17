import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Loader2, MapPin, Store } from 'lucide-react';
import { base44 } from '@/api/base44Client';

let cachedApiKey = null;
async function getApiKey() {
  if (cachedApiKey) return cachedApiKey;
  const res = await base44.functions.invoke('getGoogleMapsKey', {});
  cachedApiKey = res.data?.key || '';
  return cachedApiKey;
}

function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve) => {
    if (window.google?.maps?.places) { resolve(); return; }
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      const check = setInterval(() => {
        if (window.google?.maps?.places) { clearInterval(check); resolve(); }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=zh-TW`;
    script.async = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

/**
 * SevenElevenPicker
 * Bottom sheet to search and select a 7-11 store.
 * Props:
 *   open, onClose
 *   onSelect({ storeName, city, district, postal_code, street, gps_lat, gps_lng })
 */
export default function SevenElevenPicker({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);
  const serviceRef = useRef(null);
  const geocoderRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setError('');
    }
  }, [open]);

  const initPlaces = useCallback(async () => {
    const apiKey = await getApiKey();
    await loadGoogleMapsScript(apiKey);
    if (!serviceRef.current && window.google?.maps?.places) {
      // PlacesService requires a map or div element
      const div = document.createElement('div');
      serviceRef.current = new window.google.maps.places.PlacesService(div);
    }
    if (!geocoderRef.current && window.google?.maps) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, []);

  const searchStores = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setError('');
    try {
      await initPlaces();
      const request = {
        query: `7-ELEVEN ${q}`,
        fields: ['name', 'formatted_address', 'geometry', 'place_id'],
        region: 'TW',
      };
      serviceRef.current.textSearch(request, (places, status) => {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && places?.length > 0) {
          // Filter to only 7-ELEVEN stores
          const filtered = places.filter(p =>
            p.name?.includes('7-ELEVEN') || p.name?.includes('7-11') || p.name?.includes('統一超商')
          ).slice(0, 10);
          setResults(filtered);
          if (filtered.length === 0) setError('找不到符合的 7-ELEVEN 門市');
        } else {
          setResults([]);
          setError('找不到符合的 7-ELEVEN 門市');
        }
      });
    } catch (e) {
      setLoading(false);
      setError('搜尋失敗，請重試');
    }
  }, [initPlaces]);

  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchStores(query);
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [query, open]);

  const handleSelect = async (place) => {
    setLoading(true);
    try {
      await initPlaces();
      const apiKey = await getApiKey();
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      // Reverse geocode to get city/district/postal
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=zh-TW&key=${apiKey}`;
      const res = await fetch(geoUrl);
      const data = await res.json();

      let city = '', district = '', postal_code = '', street = place.name;

      if (data.status === 'OK' && data.results?.length > 0) {
        for (const result of data.results) {
          const comps = result.address_components;
          let rCity = '', rDistrict = '', rPostal = '', hasVillage = false;
          for (const c of comps) {
            if (c.types.includes('administrative_area_level_1')) rCity = c.long_name;
            if (c.types.includes('administrative_area_level_2')) rDistrict = c.long_name;
            else if (c.types.includes('administrative_area_level_3') && !rDistrict) rDistrict = c.long_name;
            if (c.types.includes('administrative_area_level_4')) hasVillage = true;
            if (c.types.includes('postal_code')) rPostal = c.long_name;
          }
          if (rCity && rDistrict && !hasVillage) {
            city = rCity; district = rDistrict; postal_code = rPostal;
            break;
          }
        }
        // Fallback
        if (!city) {
          for (const result of data.results) {
            for (const c of result.address_components) {
              if (!city && c.types.includes('administrative_area_level_1')) city = c.long_name;
              if (!district && (c.types.includes('administrative_area_level_3') || c.types.includes('administrative_area_level_2'))) district = c.long_name;
              if (!postal_code && c.types.includes('postal_code')) postal_code = c.long_name;
            }
            if (city && district) break;
          }
        }
      }

      onSelect({ storeName: place.name, city, district, postal_code, street: place.name, gps_lat: lat, gps_lng: lng });
      onClose();
    } catch (e) {
      setError('取得門市資訊失敗');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl flex flex-col animate-in slide-in-from-bottom duration-200" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-base font-bold text-stone-900">搜尋 7-ELEVEN 門市</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 transition-colors">
            <X className="w-4 h-4 text-stone-600" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="輸入門市名稱或地址（如：大安區、信義路）"
              className="w-full pl-9 pr-4 py-3 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
              autoFocus
            />
          </div>
          <p className="text-xs text-stone-400 mt-1.5 pl-1">例如：「大安忠孝店」、「台北信義區」</p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {loading && (
            <div className="flex items-center justify-center py-8 gap-2 text-stone-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">搜尋中...</span>
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-stone-400">
              <Store className="w-8 h-8" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!loading && !error && results.length === 0 && query.length > 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-stone-400">
              <Store className="w-8 h-8" />
              <p className="text-sm">輸入關鍵字搜尋門市</p>
            </div>
          )}
          {!loading && results.length === 0 && !query && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-stone-300">
              <Store className="w-10 h-10" />
              <p className="text-sm text-stone-400">輸入門市名稱或地區開始搜尋</p>
            </div>
          )}
          {!loading && results.map((place) => (
            <button
              key={place.place_id}
              onClick={() => handleSelect(place)}
              className="w-full flex items-start gap-3 px-3 py-3.5 rounded-xl hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0 text-left"
            >
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Store className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-800">{place.name}</p>
                <p className="text-xs text-stone-400 mt-0.5 truncate">{place.formatted_address}</p>
              </div>
              <MapPin className="w-4 h-4 text-stone-300 flex-shrink-0 mt-1 ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}