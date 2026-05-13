import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Users, Info, LogOut, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import VendorChat from './VendorChat';
import VendorInfo from './VendorInfo';
import VendorMembers from './VendorMembers';
import VendorAdminPanel from './VendorAdminPanel';

const TABS = [
  { id: 'chat', label: '群聊', icon: MessageCircle },
  { id: 'members', label: '成員', icon: Users },
  { id: 'info', label: '資訊', icon: Info },
];

export default function VendorHome({ vendor, user, onBack, onLeave }) {
  const [tab, setTab] = useState('chat');
  const [showAdmin, setShowAdmin] = useState(false);
  const isAdmin = vendor.admin_id === user?.id;

  if (showAdmin) {
    return (
      <VendorAdminPanel
        vendor={vendor}
        user={user}
        onBack={() => setShowAdmin(false)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-black px-5 pt-8 pb-4 text-white flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack}><ArrowLeft className="w-5 h-5 text-white/60" /></button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base leading-tight">{vendor.name}</p>
            <p className="text-white/40 text-xs">廠商群聊</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowAdmin(true)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white/70" />
            </button>
          )}
          <button onClick={onLeave}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/10 rounded-xl p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === id ? 'bg-white text-black' : 'text-white/60'
              }`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {tab === 'chat' && <VendorChat vendor={vendor} user={user} embedded />}
        {tab === 'members' && <VendorMembers vendor={vendor} user={user} />}
        {tab === 'info' && <VendorInfo vendor={vendor} user={user} />}
      </div>
    </div>
  );
}