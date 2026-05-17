import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Loader2, RefreshCw, Move, Pencil, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

let cachedApiKey = null;
async function getApiKey() {
  if (cachedApiKey) return cachedApiKey;
  const res = await base44.functions.invoke('getGoogleMapsKey', {});
  cachedApiKey = res.data?.key || '';
  return cachedApiKey;
}

async function geocodeWithGoogle(address, apiKey) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&language=zh-TW&region=TW&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === 'OK' && data.results?.[0]) {
    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
}

// Inject Google Maps script
function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve) => {
    if (window.google?.maps) { resolve(); return; }
    const existing = document.getElementById('google-maps-script');
    if (existing) { existing.addEventListener('load', resolve); return; }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=zh-TW`;
    script.async = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

export default function AddressMap({ address, onLocationChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [position, setPosition] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const setupMap = useCallback(async (lat, lng, zoom = 17) => {
    const apiKey = await getApiKey();
    await loadGoogleMapsScript(apiKey);
    if (!containerRef.current || !window.google?.maps) return;

    const center = { lat, lng };

    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center,
        zoom,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
      });

      mapRef.current.addListener('click', (e) => {
        if (confirmed) return;
        const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        markerRef.current?.setPosition(coords);
        setPosition(coords);
        setStatus('manual');
        onLocationChange?.(coords);
      });
    } else {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(zoom);
    }

    if (markerRef.current) {
      markerRef.current.setPosition(center);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: center,
        map: mapRef.current,
        draggable: true,
      });
      markerRef.current.addListener('dragend', () => {
        if (confirmed) return;
        const pos = markerRef.current.getPosition();
        const coords = { lat: pos.lat(), lng: pos.lng() };
        setPosition(coords);
        setStatus('manual');
        onLocationChange?.(coords);
      });
    }
  }, [onLocationChange, confirmed]);

  const doGeocode = useCallback(async () => {
    if (!address || address.length < 5) return;
    setStatus('loading');
    try {
      const apiKey = await getApiKey();
      const result = await geocodeWithGoogle(address, apiKey);
      if (result) {
        setPosition(result);
        setStatus('found');
        onLocationChange?.(result);
        await setupMap(result.lat, result.lng, 17);
      } else {
        setStatus('error');
        await setupMap(23.97, 120.97, 8);
      }
    } catch {
      setStatus('error');
      await setupMap(23.97, 120.97, 8);
    }
  }, [address, setupMap, onLocationChange]);

  useEffect(() => { setConfirmed(false); }, [address]);

  useEffect(() => {
    if (!address || address.length < 5) { setStatus('idle'); return; }
    const t = setTimeout(doGeocode, 1200);
    return () => clearTimeout(t);
  }, [address, doGeocode]);

  useEffect(() => {
    return () => {
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  if (status === 'idle') return null;

  return (
    <div className="space-y-2">
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
        <div className="flex items-center gap-1">
          {status !== 'loading' && !confirmed && (
            <Button type="button" variant="ghost" size="sm"
              className="h-6 text-xs px-2 text-stone-500 hover:text-stone-700"
              onClick={doGeocode}>
              <RefreshCw className="w-3 h-3 mr-1" />重新定位
            </Button>
          )}
          {position && status !== 'loading' && !confirmed && (
            <Button type="button" size="sm"
              className="h-6 text-xs px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              onClick={() => { setConfirmed(true); markerRef.current?.setDraggable(false); }}>
              <CheckCircle2 className="w-3 h-3 mr-1" />確認位置
            </Button>
          )}
          {confirmed && (
            <Button type="button" variant="outline" size="sm"
              className="h-6 text-xs px-3 text-amber-600 border-amber-300 hover:bg-amber-50 rounded-lg"
              onClick={() => { setConfirmed(false); markerRef.current?.setDraggable(true); }}>
              <Pencil className="w-3 h-3 mr-1" />編輯位置
            </Button>
          )}
        </div>
      </div>

      {status === 'loading' && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center" style={{ height: 240 }}>
          <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
        </div>
      )}

      <div className="relative">
        <div
          ref={containerRef}
          className="rounded-xl overflow-hidden border border-stone-200"
          style={{ height: 240, display: status === 'loading' ? 'none' : 'block' }}
        />
        {confirmed && (
          <div className="absolute inset-0 rounded-xl bg-transparent z-[1000] cursor-not-allowed" />
        )}
      </div>

      {position && status !== 'loading' && (
        <p className="text-xs text-stone-400">
          座標：{position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          {status === 'manual' && ' （手動校正）'}
        </p>
      )}
    </div>
  );
}