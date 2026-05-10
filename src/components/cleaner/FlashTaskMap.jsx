/**
 * 閃電任務地圖（Google Maps 版）
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Zap, Loader2, MapPin, Navigation, RefreshCw, X, Calendar, Clock, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';

let mapsApiPromise = null;

async function loadGoogleMaps() {
  if (window.google?.maps) return window.google.maps;
  if (mapsApiPromise) return mapsApiPromise;

  mapsApiPromise = (async () => {
    // 從後端取 API key
    const res = await base44.functions.invoke('getGoogleMapsKey', {});
    const apiKey = res.data?.key;
    if (!apiKey) throw new Error('No Google Maps API key');

    return new Promise((resolve, reject) => {
      if (document.getElementById('google-maps-script')) {
        const check = setInterval(() => {
          if (window.google?.maps) { clearInterval(check); resolve(window.google.maps); }
        }, 100);
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google.maps);
      script.onerror = () => { mapsApiPromise = null; reject(new Error('Failed to load Google Maps')); };
      document.head.appendChild(script);
    });
  })();

  return mapsApiPromise;
}

export default function FlashTaskMap({ flashTasks = [], onAccept }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const [gpsStatus, setGpsStatus] = useState('loading');
  const [selectedTask, setSelectedTask] = useState(null);

  const renderTaskMarkers = useCallback((maps) => {
    if (!mapRef.current) return;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    flashTasks.forEach(task => {
      if (!task.gps_lat || !task.gps_lng) return;
      const marker = new maps.Marker({
        position: { lat: task.gps_lat, lng: task.gps_lng },
        map: mapRef.current,
        title: task.service_type,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 18,
          fillColor: '#f59e0b',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        label: { text: '⚡', fontSize: '14px', color: '#fff' },
      });
      marker.addListener('click', () => setSelectedTask(task));
      markersRef.current.push(marker);
    });
  }, [flashTasks]);

  const initMap = useCallback(async (lat, lng) => {
    const maps = await loadGoogleMaps();
    if (!containerRef.current) return maps;

    if (!mapRef.current) {
      mapRef.current = new maps.Map(containerRef.current, {
        center: { lat, lng },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    } else {
      mapRef.current.setCenter({ lat, lng });
    }

    // 用戶位置藍點
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    userMarkerRef.current = new maps.Marker({
      position: { lat, lng },
      map: mapRef.current,
      title: '您的位置',
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
    });

    // 修正破圖 Bug
    maps.event.trigger(mapRef.current, 'resize');
    mapRef.current.setCenter({ lat, lng });

    renderTaskMarkers(maps);
    return maps;
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

  // 頁面載入自動請求 GPS（只執行一次）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { requestGPS(); }, []);

  // flashTasks 更新時重繪
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    renderTaskMarkers(window.google.maps);
  }, [flashTasks, renderTaskMarkers]);

  // 修正側邊選單開關後的破圖：監聽 resize 事件
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current && window.google?.maps) {
        window.google.maps.event.trigger(mapRef.current, 'resize');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      mapRef.current = null;
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