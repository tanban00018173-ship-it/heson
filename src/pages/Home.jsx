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

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) return;
      base44.auth.me().then(u => {
        setUser(u);
        setUserId(u.id);
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <HomeTopBar />

      <main className="pb-28">
        <AddressBar onAddressChange={setUserAddress} />
        <CategoryChips />
        <HomeServiceSections user={user} userAddress={userAddress} />
        <RecentBookings userId={userId} />
      </main>

      <CartDrawer />
      <ClientBottomNav />
    </div>
  );
}