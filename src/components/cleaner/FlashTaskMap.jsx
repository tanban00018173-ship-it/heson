/**
 * 閃電任務地圖 - Uber MVP 風格
 * 全螢幕地圖 + 頂部狀態欄 + 底部任務詳情卡片 + Google 導航
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Zap, Loader2, MapPin, Navigation, RefreshCw, X,
  Calendar, Clock, DollarSign, FileText, ExternalLink, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

let leafletPromise = null;

async function loadLeaflet() {
  if (window.L) return window.L;
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = () => { leafletPromise = null; reject(new Error('Failed to load Leaflet')); };
    document.head.appendChild(script);
  });
  return leafletPromise;
}

function openGoogleNavigation(lat, lng, address) {
  const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(address || '');
  const url = `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;
  window.open(url, '_blank');
}

export default function FlashTaskMap({ flashTasks = [], onAccept }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const userPosRef = useRef(null);
  const [gpsStatus, setGpsStatus] = useState('loading');
  const [selectedTask, setSelectedTask] = useState(null);
  const [accepting, setAccepting] = useState(false);

  const renderTaskMarkers = useCallback((L) => {
    if (!mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    flashTasks.forEach(task => {
      if (!task.gps_lat || !task.gps_lng) return;

      const pin = L.divIcon({
        html: `
          <div style="position:relative;width:44px;height:56px;">
            <div style="
              background:#f59e0b;
              width:44px;height:44px;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              box-shadow:0 4px 12px rgba(245,158,11,0.5);
              border:3px solid #fff;
            "></div>
            <div style="
              position:absolute;top:8px;left:8px;
              width:28px;height:28px;
              display:flex;align-items:center;justify-content:center;
              font-size:16px;
            ">⚡</div>
          </div>`,
        className: '',
        iconSize: [44, 56],
        iconAnchor: [22, 56],
        popupAnchor: [0, -56],
      });

      const marker = L.marker([task.gps_lat, task.gps_lng], { icon: pin })
        .addTo(mapRef.current)
        .on('click', () => setSelectedTask(task));
      markersRef.current.push(marker);
    });
  }, [flashTasks]);

  const initMap = useCallback(async (lat, lng) => {
    const L = await loadLeaflet();
    if (!containerRef.current) return;

    userPosRef.current = { lat, lng };

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([lat, lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

      // 右下角縮放按鈕
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([lat, lng], 14);
    }

    // 用戶位置（藍色脈衝圓點）
    if (userMarkerRef.current) userMarkerRef.current.remove();
    const blueIcon = L.divIcon({
      html: `
        <div style="position:relative;width:20px;height:20px;">
          <div style="position:absolute;inset:0;background:rgba(59,130,246,0.25);border-radius:50%;animation:pulse 2s infinite;"></div>
          <div style="position:absolute;inset:4px;background:#3b82f6;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(59,130,246,0.6);"></div>
        </div>
        <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:0.7}50%{transform:scale(1.8);opacity:0.2}}</style>
      `,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    userMarkerRef.current = L.marker([lat, lng], { icon: blueIcon, zIndexOffset: 1000 }).addTo(mapRef.current);

    setTimeout(() => mapRef.current?.invalidateSize(), 150);
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

  const handleAccept = async () => {
    if (!selectedTask) return;
    setAccepting(true);
    await onAccept?.(selectedTask);
    setAccepting(false);
    // 接單後立即開啟 Google 導航
    openGoogleNavigation(selectedTask.gps_lat, selectedTask.gps_lng, selectedTask.address);
    setSelectedTask(null);
  };

  return (
    <div className="relative w-full h-full" style={{ minHeight: '100vh' }}>
      {/* ── 地圖容器（全屏） ── */}
      {gpsStatus === 'loading' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-stone-100">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-3" />
          <span className="text-stone-500 text-sm">正在取得定位...</span>
        </div>
      )}
      <div ref={containerRef} className="absolute inset-0" style={{ visibility: gpsStatus === 'loading' ? 'hidden' : 'visible' }} />

      {/* ── 頂部狀態欄 ── */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="mx-4 mt-4 flex items-center justify-between gap-3 pointer-events-auto">
          {/* 任務計數 */}
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-lg">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-stone-800">
              {flashTasks.length > 0 ? `${flashTasks.length} 個閃電任務` : '附近暫無任務'}
            </span>
            {flashTasks.length > 0 && (
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            )}
          </div>

          {/* 定位按鈕 */}
          <button
            onClick={requestGPS}
            disabled={gpsStatus === 'loading'}
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-2.5 shadow-lg hover:bg-white transition-colors"
          >
            {gpsStatus === 'loading'
              ? <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
              : <Navigation className={`w-5 h-5 ${gpsStatus === 'found' ? 'text-blue-500' : 'text-stone-400'}`} />
            }
          </button>
        </div>

        {gpsStatus === 'denied' && (
          <div className="mx-4 mt-2 bg-red-500/90 backdrop-blur-sm text-white text-xs text-center py-2 px-4 rounded-xl pointer-events-auto">
            無法取得 GPS，以台北市中心顯示
          </div>
        )}
      </div>

      {/* ── 底部任務詳情卡片 ── */}
      {selectedTask && (
        <div className="absolute bottom-0 left-0 right-0 z-30">
          {/* 點擊背景關閉 */}
          <div className="fixed inset-0 z-[-1]" onClick={() => setSelectedTask(null)} />

          <div className="bg-white rounded-t-3xl shadow-2xl px-5 pt-4 pb-8 mx-0">
            {/* 拖拉條 */}
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />

            {/* 標題行 */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-stone-800 text-lg">閃電任務</span>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-0">{selectedTask.service_type}</Badge>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-1 text-stone-300 hover:text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 詳情列表 */}
            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-3 bg-stone-50 rounded-xl p-3">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-stone-400 mb-0.5">服務地址</p>
                  <p className="text-sm font-medium text-stone-700">{selectedTask.address || '地址未提供'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-stone-50 rounded-xl p-3">
                  <Calendar className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-stone-400">日期</p>
                    <p className="text-xs font-medium text-stone-700">
                      {selectedTask.scheduled_date
                        ? format(new Date(selectedTask.scheduled_date), 'M/d (EEE)', { locale: zhTW })
                        : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-stone-50 rounded-xl p-3">
                  <Clock className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-stone-400">時段</p>
                    <p className="text-xs font-medium text-stone-700">{selectedTask.time_slot || '-'}</p>
                  </div>
                </div>
              </div>

              {selectedTask.amount && (
                <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3">
                  <DollarSign className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-green-600">服務金額</p>
                    <p className="text-base font-bold text-green-700">NT$ {selectedTask.amount.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {selectedTask.notes && (
                <div className="flex items-start gap-3 bg-stone-50 rounded-xl p-3">
                  <FileText className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-stone-400 mb-0.5">備註</p>
                    <p className="text-sm text-stone-600">{selectedTask.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl h-12"
                onClick={() => setSelectedTask(null)}
              >
                略過
              </Button>
              <Button
                className="flex-2 flex-grow-[2] bg-amber-500 hover:bg-amber-600 text-white rounded-2xl h-12 font-semibold text-base shadow-lg shadow-amber-200"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting
                  ? <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  : <CheckCircle2 className="w-5 h-5 mr-2" />
                }
                接單並導航
                <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}