import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Plus, MapPin, Home, Building2, HelpCircle, ShoppingBag } from "lucide-react";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";

const CLEANING_TYPES = ['居家地址', '公司地址', '其他地址'];
const PICKUP_TYPES = ['超商取貨地址'];

const SECTION_LABELS = {
  cleaning: '清潔地址',
  pickup: '取貨地址',
};

const TYPE_LABELS = {
  '居家地址': '居家地址',
  '公司地址': '公司地址',
  '其他地址': '其他地址',
  '超商取貨地址': '超商取貨地址',
};

const TYPE_ICONS = {
  '居家地址': Home,
  '公司地址': Building2,
  '其他地址': HelpCircle,
  '超商取貨地址': ShoppingBag,
};

export default function ClientAddressList() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      if (!auth) { base44.auth.redirectToLogin(); return; }
      base44.auth.me().then(setUser);
    });
  }, []);

  const { data: addresses = [] } = useQuery({
    queryKey: ['userAddresses', user?.id],
    queryFn: () => base44.entities.UserAddress.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const cleaningAddresses = addresses.filter(a => CLEANING_TYPES.includes(a.address_type));
  const pickupAddresses = addresses.filter(a => PICKUP_TYPES.includes(a.address_type));

  const AddressCard = ({ address }) => {
    const IconComponent = TYPE_ICONS[address.address_type] || MapPin;
    return (
    <button
      onClick={() => navigate(`/ClientAddressForm?id=${address.id}`)}
      className="w-full flex items-center justify-between px-4 py-3.5 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors"
    >
      <div className="flex items-start gap-3 text-left flex-1 min-w-0">
        <IconComponent className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-stone-800">{address.full_name}</span>
            {address.is_default && (
              <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded-full">預設</span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-0.5 truncate">
            {TYPE_LABELS[address.address_type]} · {address.city}{address.district}{address.street}
          </p>
          <p className="text-xs text-stone-400">{address.phone}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0 ml-2" />
    </button>
  );
  };

  const AddSection = ({ section, type, items }) => (
    <div key={section}>
      <p className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">
        {SECTION_LABELS[section]}
      </p>
      <div className="bg-white">
        {items.map(addr => <AddressCard key={addr.id} address={addr} />)}
        <button
          onClick={() => navigate(`/ClientAddressForm?section=${section}&type=${type}`)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-stone-900 hover:bg-stone-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增地址
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col">
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-stone-900">我的地址</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto pb-36">
        <AddSection section="cleaning" type="居家地址" items={cleaningAddresses} />
        <AddSection section="pickup" type="超商取貨地址" items={pickupAddresses} />
      </div>

      <ClientBottomNav />
    </div>
  );
}