import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, RefreshCw, MapPin, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

let cachedApiKey = null;
async function getApiKey() {
  if (cachedApiKey) return cachedApiKey;
  const res = await base44.functions.invoke('getGoogleMapsKey', {});
  cachedApiKey = res.data?.key || '';
  return cachedApiKey;
}

async function geocodeAddress(address, apiKey) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&language=zh-TW&region=TW&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === 'OK' && data.results?.[0]) {
    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
}

async function reverseGeocodeCoords(lat, lng, apiKey) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=zh-TW&region=TW&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === 'OK' && data.results?.[0]) {
    const components = data.results[0].address_components;
    const cityComp = components.find(c => c.types.includes('administrative_area_level_1'));
    const distComp = components.find(c => c.types.includes('administrative_area_level_3'))
      || components.find(c => c.types.includes('administrative_area_level_2'));
    return {
      city: cityComp?.long_name || '',
      district: distComp?.long_name || '',
    };
  }
  return null;
}

function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve) => {
    if (window.google?.maps) { resolve(); return; }
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', resolve);
      if (window.google?.maps) { resolve(); return; }
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=zh-TW`;
    script.async = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

/**
 * StreetEditSheet
 * A bottom sheet for editing street address with embedded map confirmation.
 * Props:
 *   open, city, district, initialStreet, initialLat, initialLng
 *   onClose()
 *   onSave({ street, gps_lat, gps_lng })
 */
export default function StreetEditSheet({ open, city, district, initialStreet, initialLat, initialLng, onClose, onSave }) {
  const [street, setStreet] = useState(initialStreet || '');
  const [mapStatus, setMapStatus] = useState('idle'); // idle | loading | ready | error
  const [position, setPosition] = useState(null);
  const [geocodedFor, setGeocodedFor] = useState(''); // track what address was last geocoded
  const [displayCity, setDisplayCity] = useState(city || '');
  const [displayDistrict, setDisplayDistrict] = useState(district || '');

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const debounceRef = useRef(null);
  const reverseGeocodeRef = useRef(null);

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setStreet(initialStreet || '');
      setMapStatus('idle');
      setPosition(initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null);
      setGeocodedFor('');
      setDisplayCity(city || '');
      setDisplayDistrict(district || '');
      mapRef.current = null;
      markerRef.current = null;
    }
  }, [open, city, district]);

  const initMap = useCallback(async (lat, lng) => {
    const apiKey = await getApiKey();
    await loadGoogleMapsScript(apiKey);
    if (!mapContainerRef.current || !window.google?.maps) return;

    const center = { lat, lng };

    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 18,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
      });
      // 監聽地圖停止移動，讀取中心點座標
      mapRef.current.addListener('idle', () => {
        const c = mapRef.current.getCenter();
        const newPos = { lat: c.lat(), lng: c.lng() };
        setPosition(newPos);
        // 反向地理編碼以更新城市/區
        clearTimeout(reverseGeocodeRef.current);
        reverseGeocodeRef.current = setTimeout(async () => {
          try {
            const apiKey = await getApiKey();
            const result = await reverseGeocodeCoords(newPos.lat, newPos.lng, apiKey);
            if (result?.city || result?.district) {
              setDisplayCity(result.city || displayCity);
              setDisplayDistrict(result.district || displayDistrict);
            }
          } catch (e) {
            console.error('Reverse geocode error:', e);
          }
        }, 500);
      });
    } else {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(18);
    }

    setPosition({ lat, lng });
    setMapStatus('ready');
  }, []);

  const doGeocode = useCallback(async (addressStr) => {
    if (!addressStr.trim()) return;
    setMapStatus('loading');
    try {
      const apiKey = await getApiKey();
      const fullAddress = `${displayCity}${displayDistrict}${addressStr}`;
      const result = await geocodeAddress(fullAddress, apiKey);
      if (result) {
        setGeocodedFor(addressStr);
        await initMap(result.lat, result.lng);
      } else {
        setMapStatus('error');
      }
    } catch {
      setMapStatus('error');
    }
  }, [displayCity, displayDistrict, initMap]);

  // Show initial map if we have existing coords
  useEffect(() => {
    if (!open) return;
    if (initialLat && initialLng && initialStreet) {
      const t = setTimeout(() => initMap(initialLat, initialLng), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Debounce geocode when street changes
  useEffect(() => {
    if (!open || !street) return;
    if (street === geocodedFor) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doGeocode(street);
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [street, open]);

  const handleSave = () => {
    onSave({
      street,
      gps_lat: position?.lat ?? null,
      gps_lng: position?.lng ?? null,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl flex flex-col animate-in slide-in-from-bottom duration-200" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-base font-bold text-stone-900">編輯街道地址</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 transition-colors">
            <X className="w-4 h-4 text-stone-600" />
          </button>
        </div>

        {/* Street input */}
        <div className="px-5 pb-3 flex-shrink-0">
          <input
            type="text"
            value={street}
            onChange={e => setStreet(e.target.value)}
            placeholder="街道、巷弄、門號、樓層"
            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
            autoFocus
          />
          {displayCity && displayDistrict && (
            <p className="text-xs text-stone-400 mt-1.5 pl-1">{displayCity}{displayDistrict}{street || '...'}</p>
          )}
        </div>

        {/* Map area */}
        <div className="mx-5 mb-3 rounded-2xl overflow-hidden border border-stone-100 flex-shrink-0 relative" style={{ height: 220 }}>
          {mapStatus === 'idle' && (
            <div className="w-full h-full bg-stone-50 flex flex-col items-center justify-center gap-2">
              <MapPin className="w-6 h-6 text-stone-300" />
              <p className="text-xs text-stone-400">輸入街道地址後自動顯示地圖</p>
            </div>
          )}
          {mapStatus === 'loading' && (
            <div className="w-full h-full bg-stone-50 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
              <p className="text-xs text-stone-500">定位中...</p>
            </div>
          )}
          {mapStatus === 'error' && (
            <div className="w-full h-full bg-stone-50 flex flex-col items-center justify-center gap-2">
              <p className="text-xs text-stone-400">找不到此地址</p>
              <button onClick={() => doGeocode(street)} className="flex items-center gap-1 text-xs text-stone-600 underline">
                <RefreshCw className="w-3 h-3" />重試
              </button>
            </div>
          )}
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ display: mapStatus === 'ready' ? 'block' : 'none' }}
          />
          {/* 固定中心大頭針 */}
          {mapStatus === 'ready' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ paddingBottom: 28 }}>
              <MapPin className="w-8 h-8 text-red-500 drop-shadow-md" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }} />
            </div>
          )}
        </div>

        {/* Map status info */}
        {mapStatus === 'ready' && position && (
          <div className="px-5 pb-2 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-stone-500">滑動地圖可調整位置</span>
            </div>
            <button onClick={() => doGeocode(street)} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600">
              <RefreshCw className="w-3 h-3" />重新定位
            </button>
          </div>
        )}

        {/* Save button */}
        <div className="px-5 pb-8 pt-2 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={!street.trim()}
            className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl hover:bg-stone-700 disabled:opacity-40 transition-colors"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}