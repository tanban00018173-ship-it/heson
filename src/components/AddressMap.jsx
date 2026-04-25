import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Loader2, RefreshCw, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamically load Leaflet CSS
function useLeafletCSS() {
  useEffect(() => {
    if (document.getElementById('leaflet-css')) return;
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);
}

async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=tw`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'zh-TW' } });
  const data = await res.json();
  if (data && data[0]) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
  }
  return null;
}

export default function AddressMap({ address, onLocationChange }) {
  useLeafletCSS();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | found | error | manual
  const [position, setPosition] = useState(null);
  const [dragging, setDragging] = useState(false);

  const initOrUpdateMap = useCallback(async (lat, lng) => {
    const L = (await import('leaflet')).default;

    // Fix default icon path issues with bundlers
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], 17);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Click on map to move marker
      mapInstanceRef.current.on('click', (e) => {
        const newLat = e.latlng.lat;
        const newLng = e.latlng.lng;
        markerRef.current?.setLatLng([newLat, newLng]);
        setPosition({ lat: newLat, lng: newLng });
        setStatus('manual');
        onLocationChange?.({ lat: newLat, lng: newLng });
      });
    } else {
      mapInstanceRef.current.setView([lat, lng], 17);
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true })
        .addTo(mapInstanceRef.current)
        .bindPopup('拖曳大頭針或點擊地圖來校正位置');

      markerRef.current.on('dragstart', () => setDragging(true));
      markerRef.current.on('dragend', (e) => {
        const { lat: newLat, lng: newLng } = e.target.getLatLng();
        setPosition({ lat: newLat, lng: newLng });
        setStatus('manual');
        setDragging(false);
        onLocationChange?.({ lat: newLat, lng: newLng });
      });
    }
  }, [onLocationChange]);

  const doGeocode = useCallback(async () => {
    if (!address || address.length < 5) return;
    setStatus('loading');
    const result = await geocodeAddress(address);
    if (result) {
      setPosition({ lat: result.lat, lng: result.lng });
      setStatus('found');
      onLocationChange?.({ lat: result.lat, lng: result.lng });
      await initOrUpdateMap(result.lat, result.lng);
    } else {
      setStatus('error');
    }
  }, [address, initOrUpdateMap, onLocationChange]);

  // Auto-geocode when address changes (debounced)
  useEffect(() => {
    if (!address || address.length < 8) return;
    const t = setTimeout(doGeocode, 1200);
    return () => clearTimeout(t);
  }, [address, doGeocode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  if (!address || address.length < 8) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <MapPin className="w-3.5 h-3.5" />
          {status === 'loading' && <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />定位中...</span>}
          {status === 'found' && <span className="text-green-600">已自動定位，可拖曳大頭針或點擊地圖手動校正</span>}
          {status === 'manual' && <span className="text-amber-600 flex items-center gap-1"><Move className="w-3 h-3" />已手動校正位置</span>}
          {status === 'error' && <span className="text-red-500">無法自動定位，請點擊地圖手動標記</span>}
        </div>
        {(status === 'found' || status === 'manual' || status === 'error') && (
          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2 text-stone-500" onClick={doGeocode}>
            <RefreshCw className="w-3 h-3 mr-1" />重新定位
          </Button>
        )}
      </div>

      {status === 'error' && (
        <div
          ref={mapRef}
          className="rounded-xl overflow-hidden border border-stone-200"
          style={{ height: 220 }}
          onClick={async () => {
            // Init map centered on Taiwan if no result
            const L = (await import('leaflet')).default;
            if (!mapInstanceRef.current && mapRef.current) {
              await initOrUpdateMap(23.97, 120.97);
              mapInstanceRef.current?.setView([23.97, 120.97], 8);
            }
          }}
        />
      )}

      {(status === 'found' || status === 'manual') && (
        <div
          ref={mapRef}
          className="rounded-xl overflow-hidden border border-stone-200"
          style={{ height: 220 }}
        />
      )}

      {status === 'loading' && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center" style={{ height: 220 }}>
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        </div>
      )}

      {status === 'error' && !mapInstanceRef.current && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center gap-2 text-stone-400 text-xs" style={{ height: 220 }}>
          <MapPin className="w-6 h-6" />
          <span>點擊地圖任意位置標記服務地點</span>
        </div>
      )}

      {position && (
        <p className="text-xs text-stone-400">
          座標：{position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          {status === 'manual' && ' （已手動校正）'}
        </p>
      )}
    </div>
  );
}