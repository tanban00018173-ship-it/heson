import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import DashboardHome from '../components/cleanerDashboard/DashboardHome';
import DashboardOrders from '../components/cleanerDashboard/DashboardOrders';
import DashboardServices from '../components/cleanerDashboard/DashboardServices';
import DashboardReviews from '../components/cleanerDashboard/DashboardReviews';
import DashboardProfile from '../components/cleanerDashboard/DashboardProfile';
import DashboardNav from '../components/cleanerDashboard/DashboardNav';

export default function CleanerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('home');

  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) { base44.auth.redirectToLogin(); return; }
      base44.auth.me().then(setUser);
    });
  }, []);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['cleanerProfile-dashboard', user?.id],
    queryFn: () => base44.entities.CleanerProfile.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });
  const profile = profiles[0];

  const { data: bookings = [] } = useQuery({
    queryKey: ['cleanerBookings', user?.id],
    queryFn: () => base44.entities.Booking.filter({ cleaner_id: user.id }, '-created_date', 100),
    enabled: !!user?.id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['cleanerReviews', user?.id],
    queryFn: () => base44.entities.ServiceReview.filter({ cleaner_id: user.id }, '-created_date', 50),
    enabled: !!user?.id,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['cleanerServices', user?.id],
    queryFn: () => base44.entities.HomeSection.filter({ provider_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: follows = [] } = useQuery({
    queryKey: ['cleanerFollows', user?.id],
    queryFn: () => base44.entities.Follow.filter({ target_id: user.id }),
    enabled: !!user?.id,
  });

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  const sharedProps = { user, profile, bookings, reviews, services, follows, navigate };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {tab === 'home'     && <DashboardHome     {...sharedProps} onTabChange={setTab} />}
      {tab === 'orders'   && <DashboardOrders   {...sharedProps} />}
      {tab === 'services' && <DashboardServices {...sharedProps} />}
      {tab === 'reviews'  && <DashboardReviews  {...sharedProps} />}
      {tab === 'profile'  && <DashboardProfile  {...sharedProps} />}
      <DashboardNav tab={tab} onChange={setTab} bookings={bookings} />
    </div>
  );
}