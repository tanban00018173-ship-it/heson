import React from 'react';
import { MapPin, ChevronDown, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AddressBar({ address = '台北市・居家服務' }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white">
      <button
        onClick={() => navigate('/ClientAddressList')}
        className="flex items-center gap-1.5 max-w-[75%]"
      >
        <MapPin className="w-4 h-4 text-stone-700 flex-shrink-0" />
        <span className="text-sm font-semibold text-stone-800 truncate">{address}</span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
      </button>
      <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors">
        <Bell className="w-5 h-5 text-stone-600" />
      </button>
    </div>
  );
}