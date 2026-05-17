import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Plus, MapPin } from "lucide-react";
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";

const ADDRESS_TYPES = ['居家地址', '公司地址', '其他地址', '超商取貨地址'];

export default function ClientAddresses() {
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
    initialData: [],
  });

  const handleDelete = async (id) => {
    await base44.entities.UserAddress.delete(id);
    queryClient.invalidateQueries({ queryKey: ['userAddresses', user?.id] });
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col">
      {/* 頂部導航 */}
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

      {/* 內容 */}
      <div className="flex-1 overflow-y-auto pb-36">
        {ADDRESS_TYPES.map(type => {
          const list = addresses.filter(a => a.address_type === type);
          return (
            <div key={type}>
              <p className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">
                {type}
              </p>
              <div className="bg-white">
                {list.map((addr, idx) => (
                  <button
                    key={addr.id}
                    onClick={() => navigate(`/AddressForm?id=${addr.id}`)}
                    className="w-full flex items-center justify-between px-4 py-3.5 border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <MapPin className="w-4 h-4 text-stone-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-stone-800">
                          {addr.full_name}
                          {addr.is_default && <span className="ml-2 text-xs text-amber-600 font-semibold">預設</span>}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">{addr.city}{addr.district} {addr.street}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
                  </button>
                ))}
                {/* 新增地址按鈕 */}
                <button
                  onClick={() => navigate(`/AddressForm?type=${encodeURIComponent(type)}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white hover:bg-stone-50 transition-colors"
                >
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-600">新增地址</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ClientBottomNav />
    </div>
  );
}