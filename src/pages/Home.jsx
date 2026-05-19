import React, { useRef, useState, useEffect } from 'react';
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import HomeTopBar from "@/components/home/HomeTopBar";
import HeroBanner from "@/components/home/HeroBanner";
import ServiceGrid from "@/components/home/ServiceGrid";
import CartDrawer from "@/components/home/CartDrawer";
import HesonAIChat from "@/components/HesonAIChat";
import AddressBar from "@/components/home/AddressBar";
import CategoryChips from "@/components/home/CategoryChips";
import HomeServiceSections from "@/components/home/HomeServiceSections";
import RecentBookings from "@/components/home/RecentBookings";
import { base44 } from "@/api/base44Client";

export default function Home() {
  const chatRef = useRef(null);
  const [userId, setUserId] = useState(null);
  const [defaultAddress, setDefaultAddress] = useState('台北市・居家服務');

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) return;
      base44.auth.me().then(async (u) => {
        setUserId(u.id);
        // Try to load default address
        const addrs = await base44.entities.UserAddress.filter({ user_id: u.id });
        const def = addrs?.find(a => a.is_default) || addrs?.[0];
        if (def) {
          setDefaultAddress(`${def.district || def.city}・${def.street?.slice(0, 8) || '居家服務'}`);
        }
      });
    });
  }, []);

  const handleChatOpen = () => {
    window.dispatchEvent(new CustomEvent('heson:open-chat'));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top search bar */}
      <HomeTopBar onChatOpen={handleChatOpen} />

      <main className="pb-28">
        {/* Address bar */}
        <AddressBar address={defaultAddress} />

        {/* Category chips */}
        <CategoryChips />

        {/* Hero banner */}
        <div className="mt-2">
          <HeroBanner />
        </div>

        {/* Service sections */}
        <HomeServiceSections />

        {/* Recent bookings */}
        <RecentBookings userId={userId} />


      </main>

      <CartDrawer />
      <HesonAIChat autoOpenEvent="heson:open-chat" />
      <ClientBottomNav />
    </div>
  );
}