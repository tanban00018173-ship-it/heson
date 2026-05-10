/**
 * 閃電任務地圖 - Google Maps 版本
 */
import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import {
  Zap, Loader2, Navigation, X,
  Calendar, Clock, DollarSign, FileText, ExternalLink, CheckCircle2, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 25.033, lng: 121.565 };
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  draggable: true,
  gestureHandling: 'greedy',
  clickableIcons: false,
  styles: [
    // 只隱藏 POI 文字標籤，保留圖標幫助對照地址
    {
      featureType: 'poi',
      elementType: 'labels.text',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

function openGoogleNavigation(lat, lng, address) {
  const dest = lat && lng ? `${lat},${lng}` : encodeURIComponent(address || '');
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, '_blank');
}

// 內層元件：只在有真實 apiKey 時才渲染，避免 useLoadScript hook 用假 key 載入
function MapInner({ apiKey, flashTasks, onAccept }) {
  const [userPos, setUserPos] = useState(defaultCenter);
  const [gpsStatus, setGpsStatus] = useState('loading');
  const [selectedTask, setSelectedTask] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [zoom, setZoom] = useState(14);
  const mapRef = useRef(null);

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
        zoom={zoom}
        options={mapOptions}
        onLoad={map => { mapRef.current = map; }}
        onZoomChanged={() => {
          if (mapRef.current) {
            setZoom(mapRef.current.getZoom());
          }
        }}
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
        {zoom >= 15 && flashTasks.filter(t => t.gps_lat && t.gps_lng).slice(0, 5).map(task => (
          <Marker
            key={task.id}
            position={{ lat: task.gps_lat, lng: task.gps_lng }}
            onClick={() => setSelectedTask(task)}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
                  <circle cx="22" cy="22" r="20" fill="#f59e0b" stroke="#fff" stroke-width="3"/>
                  <text x="22" y="29" text-anchor="middle" font-size="20">⚡</text>
                  <polygon points="22,44 14,34 30,34" fill="#f59e0b"/>
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(44, 56),
              anchor: new window.google.maps.Point(22, 56),
            }}
            zIndex={500}
          />
        ))}
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