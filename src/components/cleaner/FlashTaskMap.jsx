/**
 * 閃電任務地圖（OpenStreetMap + Leaflet，無需 API Key）
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Zap, Loader2, MapPin, Navigation, RefreshCw, X, Calendar, Clock, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

let leafletPromise = null;

async function loadLeaflet() {
  if (window.L) return window.L;
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    // CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    // JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = () => { leafletPromise = null; reject(new Error('Failed to load Leaflet')); };
    document.head.appendChild(script);
  });

  return leafletPromise;
}

export default function FlashTaskMap({ flashTasks = [], onAccept }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const [gpsStatus, setGpsStatus] = useState('loading');
  const [selectedTask, setSelectedTask] = useState(null);

  const renderTaskMarkers = useCallback((L) => {
    if (!mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    flashTasks.forEach(task => {
      if (!task.gps_lat || !task.gps_lng) return;
      const icon = L.divIcon({
        html: `<div style="background:#f59e0b;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)">⚡</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker([task.gps_lat, task.gps_lng], { icon })
        .addTo(mapRef.current)
        .on('click', () => setSelectedTask(task));
      markersRef.current.push(marker);
    });
  }, [flashTasks]);

  const initMap = useCallback(async (lat, lng) => {
    const L = await loadLeaflet();
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([lat, lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([lat, lng], 13);
    }

    // 用戶位置藍點
    if (userMarkerRef.current) userMarkerRef.current.remove();
    const blueIcon = L.divIcon({
      html: `<div style="background:#3b82f6;border-radius:50%;width:14px;height:14px;border:3px solid #fff;box-shadow:0 2px 6px rgba(59,130,246,0.5)"></div>`,
      className: '',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    userMarkerRef.current = L.marker([lat, lng], { icon: blueIcon }).addTo(mapRef.current);

    setTimeout(() => mapRef.current?.invalidateSize(), 100);
    renderTaskMarkers(L);
  }, [renderTaskMarkers]);

  const requestGPS = useCallback(() => {
    setGpsStatus('loading');
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      initMap(25.033, 121.565);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setGpsStatus('found');
        await initMap(latitude, longitude);
      },
      () => {
        setGpsStatus('denied');
        initMap(25.033, 121.565);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [initMap]);

  useEffect(() => { requestGPS(); }, []);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    renderTaskMarkers(window.L);
  }, [flashTasks, renderTaskMarkers]);

  useEffect(() => {
    const handleResize = () => mapRef.current?.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => m.remove());
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold text-stone-800">閃電任務地圖</h2>
          {flashTasks.length > 0 && (
            <Badge className="bg-amber-500 text-white text-xs">{flashTasks.length} 個任務</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {gpsStatus === 'found' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Navigation className="w-3 h-3" />已定位
            </span>
          )}
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={requestGPS} disabled={gpsStatus === 'loading'}>
            {gpsStatus === 'loading'
              ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />定位中</>
              : <><RefreshCw className="w-3 h-3 mr-1" />重新定位</>
            }
          </Button>
        </div>
      </div>

      {gpsStatus === 'denied' && (
        <div className="px-5 py-2 bg-red-50 text-red-600 text-xs text-center">
          無法取得 GPS 定位，地圖以台北為中心顯示
        </div>
      )}

      {gpsStatus === 'loading' && (
        <div className="flex items-center justify-center" style={{ height: 380 }}>
          <div className="flex flex-col items-center gap-3 text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <span className="text-sm">正在取得定位...</span>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        style={{ height: 380, display: gpsStatus === 'loading' ? 'none' : 'block' }}
      />

      {/* 任務詳情 popup */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button
              onClick={() => setSelectedTask(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-stone-800">閃電任務</span>
              <Badge className="bg-amber-100 text-amber-700 text-xs">{selectedTask.service_type}</Badge>
            </div>

            <div className="space-y-3 text-sm text-stone-600">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <span>{selectedTask.scheduled_date && format(new Date(selectedTask.scheduled_date), 'PPP', { locale: zhTW })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-400 flex-shrink-0" />
                <span>{selectedTask.time_slot}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <span>{selectedTask.address}</span>
              </div>
              {selectedTask.amount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span className="font-semibold text-green-600">NT$ {selectedTask.amount?.toLocaleString()}</span>
                </div>
              )}
              {selectedTask.notes && (
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                  <span className="text-stone-500">{selectedTask.notes}</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setSelectedTask(null)}>
                略過
              </Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-full"
                onClick={() => { onAccept?.(selectedTask); setSelectedTask(null); }}
              >
                <Zap className="w-4 h-4 mr-1" />接受任務
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}