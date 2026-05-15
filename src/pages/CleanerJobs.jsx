import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ClipboardList, Zap, LogOut, User, Home, RefreshCw } from "lucide-react";
import AdminViewSwitcher from "@/components/AdminViewSwitcher";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FlashTaskMap from "@/components/cleaner/FlashTaskMap";
import TaskBottomPanel from "@/components/cleaner/TaskBottomPanel";
import BottomTabBar from "@/components/cleaner/BottomTabBar";
import ShopTab from "@/components/cleaner/tabs/ShopTab";
import SkillsTab from "@/components/cleaner/tabs/SkillsTab";
import TeamTab from "@/components/cleaner/tabs/TeamTab";
import ProfileTab from "@/components/cleaner/tabs/ProfileTab";
import OnlineToggle from "@/components/cleaner/OnlineToggle";
import TaskExecutionFlow from "@/components/cleaner/TaskExecutionFlow";

export default function CleanerJobs() {
  const [user, setUser] = useState(null);
  const [cleanerProfile, setCleanerProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [executingTask, setExecutingTask] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const userData = await base44.auth.me();
      setUser(userData);
      const profiles = await base44.entities.CleanerProfile.filter({ user_id: userData.id });
      if (profiles?.[0]) setCleanerProfile(profiles[0]);
    };
    loadUser();
  }, []);

  const { data: flashTasks = [], refetch: refetchFlash, isFetching } = useQuery({
    queryKey: ['flashTasks'],
    queryFn: () => base44.entities.Booking.filter({ is_flash_task: true, status: '待確認' }, '-created_date'),
    refetchInterval: 30000,
  });

  const acceptFlashMutation = useMutation({
    mutationFn: async (task) => {
      await base44.entities.Booking.update(task.id, {
        cleaner_id: cleanerProfile?.id || user?.id,
        cleaner_name: cleanerProfile?.nickname || user?.full_name,
        status: '已確認',
        confirmed_by_cleaner: true,
      });
    },
    onSuccess: (_, task) => {
      queryClient.invalidateQueries({ queryKey: ['flashTasks'] });
      toast.success('🎉 已接受閃電任務！');
      setExecutingTask(task);
    },
  });

  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayName = cleanerProfile?.nickname || user?.full_name;
  const avatarLetter = displayName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="fixed inset-0 overflow-hidden bg-stone-100 flex flex-col">

      {/* ── 非地圖 Tab 內容區 ── */}
      {activeTab !== 'map' && (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ paddingBottom: '56px' }}>
          {activeTab === 'shop'    && <ShopTab user={user} />}
          {activeTab === 'skills'  && <SkillsTab />}
          {activeTab === 'team'    && <TeamTab user={user} />}
          {activeTab === 'profile' && <ProfileTab user={user} cleanerProfile={cleanerProfile} />}
        </div>
      )}

      {/* ── 地圖區（全屏，僅地圖 tab 顯示） ── */}
      <div className={`absolute inset-0 ${activeTab !== 'map' ? 'pointer-events-none opacity-0' : ''}`}
           style={{ bottom: '56px' }}>
        <FlashTaskMap
          flashTasks={flashTasks}
          onAccept={(task) => acceptFlashMutation.mutateAsync(task)}
          selectedTask={selectedTask}
          onSelectTask={setSelectedTask}
        />

        {/* ── 左上角 上線/休息 Toggle ── */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
          <OnlineToggle cleanerProfile={cleanerProfile} />
        </div>

        {/* ── 任務數量（移到 toggle 右側，隱藏在小螢幕） ── */}
        {flashTasks.length > 0 && (
          <div className="absolute top-14 left-4 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-2xl px-3.5 py-2 shadow-md">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-stone-800">{flashTasks.length} 個閃電任務</span>
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          </div>
        )}

        {/* ── 右上角浮動控制區 ── */}
        <div className="absolute top-4 right-4 z-30 flex flex-col items-center gap-3">
          {/* 頭像選單按鈕 */}
          <button
            onClick={() => setMenuOpen(true)}
            className="w-11 h-11 rounded-full bg-white shadow-lg border-2 border-white flex items-center justify-center overflow-hidden hover:shadow-xl transition-shadow"
          >
            {cleanerProfile?.profile_photo ? (
              <img src={cleanerProfile.profile_photo} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-base font-bold text-amber-600">{avatarLetter}</span>
            )}
          </button>

          {/* 重新整理按鈕 */}
          <button
            onClick={() => refetchFlash()}
            className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-stone-500 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 舊任務數量區塊已整合至 OnlineToggle 下方 */}
      </div>

      {/* ── 底部訂單資訊面板（fixed 抽屜，僅地圖 tab） ── */}
      {activeTab === 'map' && (
        <TaskBottomPanel
          flashTasks={flashTasks}
          selectedTask={selectedTask}
          onSelectTask={setSelectedTask}
          onAccept={(task) => acceptFlashMutation.mutateAsync(task)}
          accepting={acceptFlashMutation.isPending}
        />
      )}

      {/* ── 底部 Tab Bar ── */}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── 任務執行流程 Modal ── */}
      {executingTask && (
        <TaskExecutionFlow
          booking={executingTask}
          onClose={() => setExecutingTask(null)}
          onComplete={() => {
            setExecutingTask(null);
            queryClient.invalidateQueries({ queryKey: ['flashTasks'] });
          }}
        />
      )}

      {/* ── 右側抽屜選單（Portal） ── */}
      {menuOpen && createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.35)' }}
            onClick={() => setMenuOpen(false)}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100000,
            width: '280px', background: '#fff',
            boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', overflowY: 'auto'
          }}>
            {/* 頭像區 */}
            <div className="flex items-center gap-4 p-6 bg-black border-b border-stone-800">
              <div className="w-14 h-14 rounded-full bg-stone-700 border-2 border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {cleanerProfile?.profile_photo ? (
                  <img src={cleanerProfile.profile_photo} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white">{avatarLetter}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{displayName}</p>
                <p className="text-xs text-white/40 mt-0.5 truncate">{user?.email}</p>
              </div>
              <button onClick={() => setMenuOpen(false)} className="text-white/40 hover:text-white flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 選單項目 */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {user?.role === 'admin' && (
                <div className="pb-3 mb-2 border-b border-stone-100">
                  <p className="text-xs text-stone-400 font-medium mb-2 px-1">切換視角</p>
                  <AdminViewSwitcher />
                </div>
              )}

              {[
                { to: 'CleanerJobs', icon: Zap, label: '閃電任務地圖', active: true },
                { to: 'CleanerSchedule', icon: ClipboardList, label: '我的行程' },
                { to: 'CleanerProfile', icon: User, label: '個人資料' },
                { to: 'AdminDashboard', icon: Home, label: '後台（管理員視角）', adminOnly: true },
                { to: 'ClientDashboard', icon: Home, label: '前台（客戶視角）' },
              ].map(({ to, icon: Icon, label, active, adminOnly }) => (
                user?.role === 'admin' || !adminOnly ? (
                  <Link
                    key={to}
                    to={createPageUrl(to)}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                      active ? 'bg-stone-100 text-black font-semibold' : 'text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${active ? 'bg-black' : 'bg-stone-100'}`}>
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-stone-500'}`} />
                    </div>
                    {label}
                  </Link>
                ) : null
              ))}
            </nav>

            {/* 登出 */}
            <div className="p-4 border-t border-stone-100">
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-stone-500 hover:bg-stone-50 w-full transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-stone-500" />
                </div>
                登出
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}