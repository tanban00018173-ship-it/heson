import React, { useRef } from 'react';
import ClientBottomNav from "@/components/dashboard/ClientBottomNav";
import HomeTopBar from "@/components/home/HomeTopBar";
import ServiceGrid from "@/components/home/ServiceGrid";
import CartDrawer from "@/components/home/CartDrawer";
import HesonAIChat from "@/components/HesonAIChat";

export default function Home() {
  const chatRef = useRef(null);

  const handleChatOpen = () => {
    // HesonAIChat uses its own internal toggle; we dispatch a custom event
    window.dispatchEvent(new CustomEvent('heson:open-chat'));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <HomeTopBar onChatOpen={handleChatOpen} />

      <main className="pb-28">
        <ServiceGrid />
      </main>

      <CartDrawer />
      <HesonAIChat autoOpenEvent="heson:open-chat" />
      <ClientBottomNav />
    </div>
  );
}