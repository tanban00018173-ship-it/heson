import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2, MapPin } from 'lucide-react';
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

function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve) => {
    if (window.google?.maps) { resolve(); return; }
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      if (window.google?.maps) { resolve(); return; }
      existing.addEventListener('load', resolve);
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

export default function AddressMapModal({ open, address, initialLat, initialLng, onClose, onConfirm }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [position, setPosition] = useState(null);

  const initMap = useCallback(async (lat, lng) => {
    const apiKey = await getApiKey();
    await loadGoogleMapsScript(apiKey);
    if (!containerRef.current || !window.google?.maps) return;

    const center = { lat, lng };

    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center,
        zoom: 18,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy', // 單指即可拖移
      });
    } else {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(18);
    }

    if (markerRef.current) {
      markerRef.current.setPosition(center);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: center,
        map: mapRef.current,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });
      markerRef.current.addListener('dragend', () => {
        const pos = markerRef.current.getPosition();
        setPosition({ lat: pos.lat(), lng: pos.lng() });
      });
    }

    setPosition({ lat, lng });
    setStatus('ready');
  }, []);

  const doGeocode = useCallback(async () => {
    setStatus('loading');
    try {
      const apiKey = await getApiKey();
      const result = await geocodeWithGoogle(address, apiKey);
      if (result) {
        await initMap(result.lat, result.lng);
      } else {
        setStatus('error');
        await initMap(23.97, 120.97);
      }
    } catch {
      setStatus('error');
    }
  }, [address, initMap]);

  // Reset and geocode when modal opens
  useEffect(() => {
    if (!open) return;
    // Destroy old map instance so it re-creates on the new container mount
    mapRef.current = null;
    markerRef.current = null;
    setStatus('loading');
    setPosition(null);

    const init = async () => {
      if (initialLat && initialLng) {
        await initMap(initialLat, initialLng);
      } else {
        await doGeocode();
      }
    };

    // Small delay to ensure DOM is ready
    const t = setTimeout(init, 100);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <div className="flex-1">
          <p className="text-base font-bold text-stone-900">校正精準位置</p>
          <p className="text-xs text-stone-400">拖曳大頭針至精確位置</p>
        </div>
        <button
          onClick={doGeocode}
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 px-2 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />重新定位
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-stone-50 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            <p className="text-sm text-stone-500">定位中...</p>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Address label + confirm */}
      <div className="bg-white border-t border-stone-100 px-4 pt-4 pb-8 flex-shrink-0 space-y-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-stone-800 leading-snug">{address}</p>
            {position && (
              <p className="text-xs text-stone-400 mt-0.5">
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => position && onConfirm(position)}
          disabled={!position || status === 'loading'}
          className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-700 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-colors"
        >
          <CheckCircle2 className="w-5 h-5" />
          確認此位置
        </button>
      </div>
    </div>
  );
}