import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export default function ServiceDetailSheet({ item, onClose }) {
  const navigate = useNavigate();
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet 內容 */}
      <div className="relative bg-white rounded-t-3xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">
        {/* 圖片 */}
        <div className="w-full h-56 bg-stone-100 flex-shrink-0 relative overflow-hidden">
          {item.image_url
            ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><span className="text-6xl">🧹</span></div>
          }
          {item.badge && (
            <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">{item.badge}</span>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 文字內容 */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6">
          <h2 className="text-xl font-black text-stone-900 leading-tight">{item.title}</h2>
          {item.subtitle && (
            <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">{item.subtitle}</p>
          )}
          {item.price != null && (
            <p className="mt-4 text-2xl font-black text-stone-900">
              <span className="text-base font-bold">NT$ </span>
              {item.price.toLocaleString()}
              <span className="text-sm font-normal text-stone-400 ml-1">起</span>
            </p>
          )}
          {(item.service_areas || []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.service_areas.map(a => (
                <span key={a} className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">{a}</span>
              ))}
            </div>
          )}
        </div>

        {/* 底部預約按鈕 */}
        <div className="px-5 pb-8 pt-3 border-t border-stone-100 flex-shrink-0">
          <button
            onClick={() => { onClose(); navigate('/ClientBooking'); }}
            className="w-full bg-stone-900 text-white font-bold text-base py-4 rounded-2xl active:scale-95 transition-transform"
          >
            立即預約
          </button>
        </div>
      </div>
    </div>
  );
}