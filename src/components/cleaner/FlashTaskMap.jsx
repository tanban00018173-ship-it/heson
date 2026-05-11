/**
 * 閃電任務地圖 - Google Maps 版本 with Clustering
 * 底部面板已移至 TaskBottomPanel，地圖僅負責顯示標記
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { Zap, Loader2, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 25.033, lng: 121.565 };
const mapOptions = {
  disableDefaultUI: true,
  draggable: true,
  gestureHandling: 'greedy',
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "poi.park", stylers: [{ visibility: "on" }] }
  ]
};

function clusterTasks(tasks, radius = 0.015) {
  const clusters = [];
  const visited = new Set();
  tasks.forEach((task, idx) => {
    if (visited.has(idx)) return;
    const cluster = [task];
    visited.add(idx);
    tasks.forEach((other, otherIdx) => {
      if (visited.has(otherIdx)) return;
      const dist = Math.sqrt(
        Math.pow(task.gps_lat - other.gps_lat, 2) +
        Math.pow(task.gps_lng - other.gps_lng, 2)
      );
      if (dist < radius) { cluster.push(other); visited.add(otherIdx); }
    });
    clusters.push(cluster);
  });
  return clusters;
}

function MapInner({ apiKey, flashTasks, selectedTask, onSelectTask }) {
  const [userPos, setUserPos] = useState(defaultCenter);
  const [gpsStatus, setGpsStatus] = useState('loading');
  const mapRef = useRef(null);

  const clusters = useMemo(() => {
    const validTasks = flashTasks.filter(t => t.gps_lat && t.gps_lng);
    return clusterTasks(validTasks);
  }, [flashTasks]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    preventGoogleFontsLoading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserPos({ lat: coords.latitude, lng: coords.longitude });
        setGpsStatus('found');
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // 選中任務時，地圖移動到該任務位置
  useEffect(() => {
    if (selectedTask && mapRef.current && selectedTask.gps_lat && selectedTask.gps_lng) {
      mapRef.current.panTo({ lat: selectedTask.gps_lat, lng: selectedTask.gps_lng });
      mapRef.current.setZoom(16);
    }
  }, [selectedTask]);

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
        {/* 使用者位置 */}
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

        {/* 聚類任務標記 */}
        {clusters.map((cluster, idx) => {
          const centerLat = cluster.reduce((sum, t) => sum + t.gps_lat, 0) / cluster.length;
          const centerLng = cluster.reduce((sum, t) => sum + t.gps_lng, 0) / cluster.length;
          const isSelected = cluster.some(t => t.id === selectedTask?.id);

          return (
            <Marker
              key={`cluster-${idx}`}
              position={{ lat: centerLat, lng: centerLng }}
              onClick={() => {
                if (cluster.length === 1) {
                  onSelectTask(isSelected ? null : cluster[0]);
                } else {
                  onSelectTask(isSelected ? null : cluster[0]);
                }
              }}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="28" fill="${isSelected ? '#d97706' : '#f59e0b'}" stroke="#fff" stroke-width="3"/>
                    ${isSelected ? '<circle cx="30" cy="30" r="20" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>' : ''}
                    <text x="30" y="37" text-anchor="middle" font-size="20" font-weight="bold" fill="#fff">${cluster.length}</text>
                  </svg>
                `)}`,
                scaledSize: new window.google.maps.Size(60, 60),
                anchor: new window.google.maps.Point(30, 30),
              }}
              zIndex={isSelected ? 800 : 500}
            />
          );
        })}
      </GoogleMap>

      {/* GPS 警示 */}
      {gpsStatus === 'denied' && (
        <div className="absolute top-16 left-4 right-16 z-10 bg-red-500/90 text-white text-xs text-center py-2 px-4 rounded-xl">
          無法取得 GPS，以台北市中心顯示
        </div>
      )}
    </div>
  );
}

export default function FlashTaskMap({ flashTasks = [], onAccept, selectedTask, onSelectTask }) {
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

  return (
    <MapInner
      apiKey={apiKey}
      flashTasks={flashTasks}
      onAccept={onAccept}
      selectedTask={selectedTask}
      onSelectTask={onSelectTask}
    />
  );
}