/**
 * Admin Master View Switcher
 * 讓 Admin 可以在三個入口（前台/中台/後台）之間無縫切換
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, ChevronDown } from 'lucide-react';

const VIEWS = [
  { label: '後台 (Admin)', path: '/AdminDashboard', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  { label: '中台 (Provider)', path: '/CleanerJobs', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { label: '前台 (Client)', path: '/ClientDashboard', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
];

export default function AdminViewSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const current = VIEWS.find(v => location.pathname === v.path) ||
    VIEWS.find(v => location.pathname.startsWith('/Admin') && v.path === '/AdminDashboard') ||
    VIEWS.find(v => location.pathname.startsWith('/Cleaner') && v.path === '/CleanerJobs') ||
    VIEWS.find(v => location.pathname.startsWith('/Client') && v.path === '/ClientDashboard') ||
    VIEWS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${current.bg} ${current.border} ${current.color}`}
      >
        <Eye className="w-3.5 h-3.5" />
        <span>{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1.5 right-0 z-50 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden min-w-[160px]">
            {VIEWS.map(view => (
              <button
                key={view.path}
                onClick={() => { navigate(view.path); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium hover:bg-stone-50 transition-colors text-left ${view.color}`}
              >
                <span className={`w-2 h-2 rounded-full ${view.bg.replace('bg-', 'bg-').replace('50', '400')}`} />
                {view.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}