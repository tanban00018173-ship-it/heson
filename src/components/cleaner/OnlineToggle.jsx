import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, ZapOff } from 'lucide-react';

/**
 * 上線/休息 Toggle
 * Persists to CleanerProfile.is_active
 */
export default function OnlineToggle({ cleanerProfile, onToggle }) {
  const [online, setOnline] = useState(cleanerProfile?.is_active ?? false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOnline(cleanerProfile?.is_active ?? false);
  }, [cleanerProfile?.is_active]);

  const toggle = async () => {
    if (!cleanerProfile?.id) return;
    setLoading(true);
    const next = !online;
    try {
      await base44.entities.CleanerProfile.update(cleanerProfile.id, { is_active: next });
      setOnline(next);
      if (onToggle) onToggle(next);
    } catch (e) {
      console.warn('Toggle failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-lg ${
        online
          ? 'bg-green-500 text-white shadow-green-500/30'
          : 'bg-stone-700 text-stone-300 shadow-stone-900/30'
      } ${loading ? 'opacity-60' : ''}`}
    >
      {online
        ? <><Zap className="w-3.5 h-3.5" />上線接單</>
        : <><ZapOff className="w-3.5 h-3.5" />休息中</>
      }
      <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-200 animate-pulse' : 'bg-stone-500'}`} />
    </button>
  );
}