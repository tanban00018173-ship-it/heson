/**
 * 閃電任務地圖
 * 顯示附近待確認的閃電任務大頭針，清潔人員可查看需求並接單
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Zap, Loader2, MapPin, Navigation, RefreshCw, X, Calendar, Clock, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

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

export default function FlashTaskMap({ flashTasks = [], onAccept }) {
  useLeafletCSS();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [gpsStatus, setGpsStatus] = useState('loading'); // idle | loading | found | denied
  const [userPos, setUserPos] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // 初始化地圖
  const initMap = useCallback(async (lat, lng) => {
    const L = (await import('leaflet')).default;
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([lat, lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([lat, lng], 13);
    }

    // 用戶位置藍點
    const userIcon = L.divIcon({
      html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.3)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      className: '',
    });
    L.marker([lat, lng], { icon: userIcon }).addTo(mapRef.current)
      .bindPopup('您的位置');

    setTimeout(() => mapRef.current?.invalidateSize(), 150);
    return L;
  }, []);

  // 在地圖上繪製任務大頭針
  const renderTaskMarkers = useCallback(async (L) => {
    if (!mapRef.current || !L) return;

    // 清除舊大頭針
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    flashTasks.forEach(task => {
      if (!task.gps_lat || !task.gps_lng) return;

      const zapIcon = L.divIcon({
        html: `<div style="
          background:#f59e0b;
          border:2px solid white;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          width:36px;height:36px;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
        "><span style="transform:rotate(45deg);font-size:16px;">⚡</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        className: '',
      });

      const marker = L.marker([task.gps_lat, task.gps_lng], { icon: zapIcon })
        .addTo(mapRef.current)
        .on('click', () => setSelectedTask(task));

      markersRef.current.push(marker);
    });
  }, [flashTasks]);

  // 請求 GPS
  const requestGPS = useCallback(() => {
    setGpsStatus('loading');
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        setGpsStatus('found');
        const L = await initMap(latitude, longitude);
        await renderTaskMarkers(L);
      },
      () => {
        setGpsStatus('denied');
        // 預設台北
        initMap(25.033, 121.565).then(L => renderTaskMarkers(L));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [initMap, renderTaskMarkers]);

  // 當 flashTasks 更新時重繪大頭針
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then(({ default: L }) => renderTaskMarkers(L));
  }, [flashTasks, renderTaskMarkers]);

  // 頁面載入時自動請求 GPS
  useEffect(() => {
    requestGPS();
  }, []);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
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
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={requestGPS}>
            {gpsStatus === 'loading'
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <><RefreshCw className="w-3 h-3 mr-1" />{gpsStatus === 'idle' ? '開啟地圖' : '重新定位'}</>
            }
          </Button>
        </div>
      </div>

      {/* GPS 請求提示 */}
      {/* GPS loading spinner before map appears */}

      {gpsStatus === 'denied' && (
        <div className="px-5 py-3 bg-red-50 text-red-600 text-xs text-center">
          無法取得 GPS 定位，地圖以台北為中心顯示
        </div>
      )}

      {/* 地圖 */}
      <div
        ref={containerRef}
        style={{ height: 380, display: gpsStatus === 'idle' ? 'none' : 'block' }}
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