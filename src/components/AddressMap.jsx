import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Loader2, RefreshCw, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const res = await fetch(url, { headers: { 'Accept-Language': 'zh-TW', 'User-Agent': 'HesonBooking/1.0' } });
  const data = await res.json();
  if (data && data[0]) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

export default function AddressMap({ address, onLocationChange }) {
  useLeafletCSS();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | found | manual | error
  const [position, setPosition] = useState(null);

  const setupMap = useCallback(async (lat, lng) => {
    const L = (await import('leaflet')).default;

    // Fix Leaflet default icon
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([lat, lng], 17);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Click map to reposition marker
      mapRef.current.on('click', (e) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        }
        const coords = { lat: newLat, lng: newLng };
        setPosition(coords);
        setStatus('manual');
        onLocationChange?.(coords);
      });
    } else {
      mapRef.current.setView([lat, lng], 17);
    }

    // Update or create marker
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
      markerRef.current.bindPopup('可拖曳大頭針或點擊地圖手動校正').openPopup();

      markerRef.current.on('dragend', (e) => {
        const { lat: newLat, lng: newLng } = e.target.getLatLng();
        const coords = { lat: newLat, lng: newLng };
        setPosition(coords);
        setStatus('manual');
        onLocationChange?.(coords);
      });
    }

    // Invalidate size after map is visible
    setTimeout(() => mapRef.current?.invalidateSize(), 100);
  }, [onLocationChange]);

  const doGeocode = useCallback(async () => {
    if (!address || address.length < 6) return;
    setStatus('loading');
    try {
      const result = await geocodeAddress(address);
      if (result) {
        setPosition(result);
        setStatus('found');
        onLocationChange?.(result);
        await setupMap(result.lat, result.lng);
      } else {
        setStatus('error');
        // Show map centered on Taiwan for manual marking
        await setupMap(23.97, 120.97);
        mapRef.current?.setZoom(8);
      }
    } catch {
      setStatus('error');
    }
  }, [address, setupMap, onLocationChange]);

  // Debounce geocode on address change
  useEffect(() => {
    if (!address || address.length < 6) {
      setStatus('idle');
      return;
    }
    const t = setTimeout(doGeocode, 1000);
    return () => clearTimeout(t);
  }, [address, doGeocode]);

  // Cleanup
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  if (!address || address.length < 6) return null;

  return (
    <div className="space-y-2">
      {/* Status bar */}
      <div className="flex items-center justify-between min-h-[20px]">
        <div className="flex items-center gap-1.5 text-xs">
          <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          {status === 'loading' && (
            <span className="flex items-center gap-1 text-stone-500">
              <Loader2 className="w-3 h-3 animate-spin" />自動定位中...
            </span>
          )}
          {status === 'found' && (
            <span className="text-green-600">已自動定位 · 可拖曳大頭針或點擊地圖手動校正</span>
          )}
          {status === 'manual' && (
            <span className="text-amber-600 flex items-center gap-1">
              <Move className="w-3 h-3" />已手動校正位置
            </span>
          )}
          {status === 'error' && (
            <span className="text-red-500">無法自動定位，請點擊地圖手動標記</span>
          )}
        </div>
        {(status === 'found' || status === 'manual' || status === 'error') && (
          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2 text-stone-500 hover:text-stone-700" onClick={doGeocode}>
            <RefreshCw className="w-3 h-3 mr-1" />重新定位
          </Button>
        )}
      </div>

      {/* Map container — always rendered when status is not idle/loading-before-first-show */}
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-stone-200 bg-stone-100"
        style={{ height: 240, display: status === 'idle' ? 'none' : 'block' }}
      />

      {/* Loading placeholder */}
      {status === 'loading' && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center -mt-[240px] relative z-0 pointer-events-none" style={{ height: 240 }}>
          <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
        </div>
      )}

      {/* Coords display */}
      {position && status !== 'loading' && (
        <p className="text-xs text-stone-400">
          座標：{position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          {status === 'manual' && ' （手動校正）'}
        </p>
      )}
    </div>
  );
}