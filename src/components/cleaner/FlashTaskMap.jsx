/**
 * 閃電任務地圖 - Google Maps 版本 with Clustering
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import {
  Zap, Loader2, Navigation, X, ChevronDown,
  Calendar, Clock, DollarSign, FileText, ExternalLink, CheckCircle2, MapPin, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 25.033, lng: 121.565 };
const mapOptions = {
  disableDefaultUI: true,
  draggable: true,
  gestureHandling: 'greedy',
  clickableIcons: false,
};

function openGoogleNavigation(lat, lng, address) {
  const dest = lat && lng ? `${lat},${lng}` : encodeURIComponent(address || '');
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, '_blank');
}

// 簡單的地理位置聚類演算法
function clusterTasks(tasks, radius = 0.02) {
  const clusters = [];
  const visited = new Set();

  tasks.forEach((task, idx) => {
    if (visited.has(idx)) return;
    
    const cluster = [task];
    visited.add(idx);
    
    tasks.forEach((otherTask, otherIdx) => {
      if (visited.has(otherIdx)) return;
      const dist = Math.sqrt(
        Math.pow(task.gps_lat - otherTask.gps_lat, 2) +
        Math.pow(task.gps_lng - otherTask.gps_lng, 2)
      );
      if (dist < radius) {
        cluster.push(otherTask);
        visited.add(otherIdx);
      }
    });
    
    clusters.push(cluster);
  });

  return clusters;
}

// 內層元件：只在有真實 apiKey 時才渲染，避免 useLoadScript hook 用假 key 載入
function MapInner({ apiKey, flashTasks, onAccept }) {
  const [userPos, setUserPos] = useState(defaultCenter);
  const [gpsStatus, setGpsStatus] = useState('loading');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const mapRef = useRef(null);

  // 聚類任務
  const clusters = useMemo(() => {
    const validTasks = flashTasks.filter(t => t.gps_lat && t.gps_lng);
    return clusterTasks(validTasks, 0.015);
  }, [flashTasks]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    preventGoogleFontsLoading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setUserPos({ lat: coords.latitude, lng: coords.longitude }); setGpsStatus('found'); },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleAccept = async () => {
    if (!selectedTask) return;
    setAccepting(true);
    await onAccept?.(selectedTask);
    setAccepting(false);
    openGoogleNavigation(selectedTask.gps_lat, selectedTask.gps_lng, selectedTask.address);
    setSelectedTask(null);
  };

  const centerOnUser = () => {
    if (mapRef.current && userPos) {
      mapRef.current.panTo(userPos);
      mapRef.current.setZoom(15);
    }
  };

  if (loadError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
        <p className="text-red-500 text-sm">地圖載入失敗，請確認 API Key 是否正確</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-3" />
        <span className="text-stone-500 text-sm">載入 Google Maps...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userPos}
        zoom={14}
        options={mapOptions}
        onLoad={map => { mapRef.current = map; }}
      >
        <Marker
          position={userPos}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          }}
          zIndex={1000}
        />
        
        {/* 聚類標記 */}
        {clusters.map((cluster, idx) => {
          const centerLat = cluster.reduce((sum, t) => sum + t.gps_lat, 0) / cluster.length;
          const centerLng = cluster.reduce((sum, t) => sum + t.gps_lng, 0) / cluster.length;
          
          return (
            <Marker
              key={`cluster-${idx}`}
              position={{ lat: centerLat, lng: centerLng }}
              onClick={() => setSelectedCluster(cluster.length > 1 ? cluster : null)}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="26" fill="#f59e0b" stroke="#fff" stroke-width="3"/>
                    <text x="28" y="35" text-anchor="middle" font-size="18" font-weight="bold" fill="#fff">${cluster.length}</text>
                  </svg>
                `)}`,
                scaledSize: new window.google.maps.Size(56, 56),
                anchor: new window.google.maps.Point(28, 28),
              }}
              zIndex={cluster.length > 1 ? 600 : 500}
            />
          );
        })}
      </GoogleMap>

      {/* 頂部狀態欄 */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-lg pointer-events-auto">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-stone-800">
            {flashTasks.length > 0 ? `${flashTasks.length} 個閃電任務` : '附近暫無任務'}
          </span>
          {flashTasks.length > 0 && <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />}
        </div>
        <button
          onClick={centerOnUser}
          className="bg-white/95 backdrop-blur-sm rounded-2xl p-2.5 shadow-lg hover:bg-white transition-colors pointer-events-auto"
        >
          <Navigation className={`w-5 h-5 ${gpsStatus === 'found' ? 'text-blue-500' : 'text-stone-400'}`} />
        </button>
      </div>

      {gpsStatus === 'denied' && (
        <div className="absolute top-16 left-4 right-4 z-10 bg-red-500/90 text-white text-xs text-center py-2 px-4 rounded-xl">
          無法取得 GPS，以台北市中心顯示
        </div>
      )}

      {/* 底部圓點列表入口 */}
      {!selectedTask && !selectedCluster && (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex flex-col items-center gap-2">
          <div className="flex gap-2">
            {flashTasks.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-amber-500' : 'bg-stone-300'}`}
              />
            ))}
          </div>
          {flashTasks.length > 0 && (
            <button
              onClick={() => setSelectedCluster(flashTasks)}
              className="bg-amber-500 text-white text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-lg shadow-amber-200 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              查看全部 {flashTasks.length} 筆任務
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 底部任務詳情卡片 */}
      {selectedTask && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-2xl px-5 pt-4 pb-8">
          <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
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
                    {selectedTask.scheduled_date ? format(new Date(selectedTask.scheduled_date), 'M/d (EEE)', { locale: zhTW }) : '-'}
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

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-2xl h-12" onClick={() => setSelectedTask(null)}>略過</Button>
            <Button
              className="flex-[2] bg-amber-500 hover:bg-amber-600 text-white rounded-2xl h-12 font-semibold text-base shadow-lg shadow-amber-200"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
              接單並導航
              <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
            </Button>
          </div>
        </div>
      )}

      {/* 底部任務列表面板（聚類或全部任務） */}
      {selectedCluster && !selectedTask && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: '70vh' }}>
          <div className="px-5 pt-4 pb-3 flex-shrink-0">
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-stone-800">共 {selectedCluster.length} 筆閃電任務</span>
              </div>
              <button onClick={() => setSelectedCluster(null)} className="p-1 text-stone-300 hover:text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto px-4 pb-8 space-y-3">
            {selectedCluster.map(task => (
              <div
                key={task.id}
                className="bg-stone-50 rounded-2xl p-4 border border-stone-100"
                onClick={() => { setSelectedTask(task); setSelectedCluster(null); }}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">{task.service_type}</Badge>
                  {task.amount && (
                    <span className="text-sm font-bold text-green-700">NT$ {task.amount.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-stone-700">{task.address || '地址未提供'}</p>
                </div>
                <div className="flex gap-3 text-xs text-stone-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {task.scheduled_date ? format(new Date(task.scheduled_date), 'M/d (EEE)', { locale: zhTW }) : '-'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.time_slot || '-'}
                  </span>
                </div>
                <div className="mt-2 flex justify-end">
                  <span className="text-xs text-amber-600 font-medium">點擊查看詳情 →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 外層元件：負責取得 API Key，只有取得後才渲染 MapInner
export default function FlashTaskMap({ flashTasks = [], onAccept }) {
  const [apiKey, setApiKey] = useState('');
  const [keyLoaded, setKeyLoaded] = useState(false);

  useEffect(() => {
    base44.functions.invoke('getGoogleMapsKey', {})
      .then(res => { setApiKey(res.data?.key || ''); setKeyLoaded(true); })
      .catch(() => setKeyLoaded(true));
  }, []);

  if (!keyLoaded) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-3" />
        <span className="text-stone-500 text-sm">載入地圖中...</span>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100 p-6 text-center">
        <MapPin className="w-12 h-12 text-stone-300 mb-4" />
        <p className="text-stone-600 font-medium mb-2">尚未設定 Google Maps API Key</p>
        <p className="text-stone-400 text-sm">請在後台設定 <code className="bg-stone-200 px-1 rounded">GOOGLE_MAPS_API_KEY</code> 環境變數</p>
      </div>
    );
  }

  return <MapInner apiKey={apiKey} flashTasks={flashTasks} onAccept={onAccept} />;
}