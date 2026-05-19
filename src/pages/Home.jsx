import React, { useState, useEffect } from 'react';
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import HomeTopBar from "@/components/home/HomeTopBar";
import CartDrawer from "@/components/home/CartDrawer";
import AddressBar from "@/components/home/AddressBar";
import CategoryChips from "@/components/home/CategoryChips";
import HomeServiceSections from "@/components/home/HomeServiceSections";
import RecentBookings from "@/components/home/RecentBookings";
import { base44 } from "@/api/base44Client";

export default function Home() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [defaultAddress, setDefaultAddress] = useState('台北市・居家服務');

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) return;
      base44.auth.me().then(async (u) => {
        setUser(u);
        setUserId(u.id);
        const addrs = await base44.entities.UserAddress.filter({ user_id: u.id });
        const def = addrs?.find(a => a.is_default) || addrs?.[0];
        if (def) {
          setUserAddress(def);
          setDefaultAddress(`${def.district || def.city}・${def.street?.slice(0, 8) || '居家服務'}`);
        }
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <HomeTopBar />

      <main className="pb-28">
        <AddressBar address={defaultAddress} />
        <CategoryChips />
        <HomeServiceSections user={user} userAddress={userAddress} />
        <RecentBookings userId={userId} />
      </main>

      <CartDrawer />
      <ClientBottomNav />
    </div>
  );
}