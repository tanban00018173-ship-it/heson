import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Navigation, MapPin, Camera, CheckCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const GPS_THRESHOLD_M = 100; // 100 公尺內才能打卡

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function TaskExecutionFlow({ booking, onClose, onComplete }) {
  const [step, setStep] = useState('navigate'); // navigate | arrive | upload | done
  const [checking, setChecking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const openNav = () => {
    const { gps_lat, gps_lng, address } = booking;
    const query = gps_lat && gps_lng ? `${gps_lat},${gps_lng}` : encodeURIComponent(address);
    window.open(`https://maps.google.com/maps?daddr=${query}`, '_blank');
  };

  const checkArrival = () => {
    if (!booking.gps_lat || !booking.gps_lng) {
      // No GPS on booking – allow direct check-in
      setStep('upload');
      return;
    }
    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const dist = haversineMeters(pos.coords.latitude, pos.coords.longitude, booking.gps_lat, booking.gps_lng);
        setChecking(false);
        if (dist <= GPS_THRESHOLD_M) {
          setStep('upload');
          toast.success('✅ 已確認到達現場！');
        } else {
          toast.error(`📍 距案場 ${Math.round(dist)} 公尺，請靠近 ${GPS_THRESHOLD_M} 公尺內再打卡`);
        }
      },
      () => {
        setChecking(false);
        toast.error('無法取得 GPS，請開啟定位權限');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Booking.update(booking.id, { status: '進行中' });
      // Save to ServiceReport
      await base44.entities.ServiceReport.create({
        booking_id: booking.id,
        cleaner_id: booking.cleaner_id,
        after_photos: [file_url],
        service_date: new Date().toISOString().split('T')[0],
        cleaner_notes: '已到達現場，開始服務',
      });
      setStep('done');
      if (onComplete) onComplete();
    } catch (err) {
      toast.error('照片上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  const steps = [
    { id: 'navigate', label: '出發導航', icon: Navigation },
    { id: 'arrive',   label: '到場打卡', icon: MapPin },
    { id: 'upload',   label: '完工回報', icon: Camera },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-white font-bold text-lg">{booking.service_type}</h3>
            <p className="text-stone-400 text-sm mt-0.5">{booking.address}</p>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors ml-3 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-6">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`flex flex-col items-center ${step === s.id ? 'opacity-100' : step === 'done' || steps.findIndex(x=>x.id===step) > i ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.id ? 'bg-amber-500 text-black' : steps.findIndex(x=>x.id===step) > i ? 'bg-green-500 text-white' : 'bg-white/10 text-stone-500'
                }`}>
                  {steps.findIndex(x=>x.id===step) > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <p className="text-[10px] text-stone-500 mt-1 whitespace-nowrap">{s.label}</p>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-4 ${steps.findIndex(x=>x.id===step) > i ? 'bg-green-500' : 'bg-white/10'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Content by step */}
        {step === 'navigate' && (
          <div className="space-y-3">
            <p className="text-stone-400 text-sm">前往服務地點，準備出發時點擊導航</p>
            <button onClick={openNav}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors">
              <Navigation className="w-5 h-5" /> 開始導航
            </button>
            <button onClick={() => setStep('arrive')}
              className="w-full bg-white/10 hover:bg-white/15 text-stone-300 font-medium py-3 rounded-2xl text-sm transition-colors">
              已抵達，前往打卡
            </button>
          </div>
        )}

        {step === 'arrive' && (
          <div className="space-y-3">
            <p className="text-stone-400 text-sm">距案場 <span className="text-amber-400">{GPS_THRESHOLD_M} 公尺</span>內才能打卡（防止假到場）</p>
            <button onClick={checkArrival} disabled={checking}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
              {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
              {checking ? 'GPS 定位中...' : '📍 我已到達現場'}
            </button>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-3">
            <p className="text-stone-400 text-sm">上傳完工照片後，系統自動更新訂單狀態</p>
            <input ref={fileRef} type="file" accept="image/*" capture="camera" className="hidden" onChange={handlePhotoUpload} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              {uploading ? '上傳中...' : '📸 上傳完工照片'}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <p className="text-white font-bold mb-1">服務已完成！</p>
            <p className="text-stone-400 text-sm">等待客戶確認後自動結算</p>
            <button onClick={onClose} className="mt-4 w-full bg-white/10 text-stone-300 py-3 rounded-2xl text-sm hover:bg-white/15 transition-colors">關閉</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}