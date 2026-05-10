import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Menu, X, ClipboardList, Zap, LogOut, User, Home } from "lucide-react";
import AdminViewSwitcher from "@/components/AdminViewSwitcher";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FlashTaskMap from "@/components/cleaner/FlashTaskMap";

export default function CleanerJobs() {
  const [user, setUser] = useState(null);
  const [cleanerProfile, setCleanerProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const { data: flashTasks = [], refetch: refetchFlash } = useQuery({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashTasks'] });
      toast.success('🎉 已接受閃電任務！正在開啟導航...');
    },
  });

  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-stone-100">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayName = cleanerProfile?.nickname || user?.full_name;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* ── 地圖區（全屏） ── */}
      <div className="relative flex-1 overflow-hidden">
        <FlashTaskMap
          flashTasks={flashTasks}
          onAccept={(task) => acceptFlashMutation.mutateAsync(task)}
        />
        

      </div>

      {/* ── 底部導航欄（手機版） ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 flex items-center justify-between px-4 py-3">
        {/* Logo / 品牌 */}
        <div className="flex items-center gap-2">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/b0c86a022_557043631_1369298458531323_7985963993755754895_n.jpg"
            alt="HESON"
            className="h-7 w-auto"
          />
        </div>

        {/* 漢堡選單 */}
        <button
          onClick={() => setMenuOpen(true)}
          className="p-2 rounded-xl hover:bg-stone-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-stone-600" />
        </button>
      </div>

      {/* ── 側拉選單（Portal 渲染到 body，完全跳脫 Leaflet stacking context） ── */}
      {menuOpen && createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.35)' }}
            onClick={() => setMenuOpen(false)}
          />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100000, width: '288px', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
            {/* 選單頭 */}
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <div>
                <p className="font-semibold text-stone-800">{displayName}</p>
                <p className="text-xs text-stone-400 mt-0.5">{user?.email}</p>
              </div>
              <button onClick={() => setMenuOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 選單項目 */}
            <nav className="flex-1 p-4 space-y-1">
              {/* 管理員視角切換 */}
              {user?.role === 'admin' && (
                <div className="pb-3 mb-2 border-b border-stone-100">
                  <p className="text-xs text-stone-400 font-medium mb-2 px-1">切換視角</p>
                  <AdminViewSwitcher />
                </div>
              )}

              <Link
                to={createPageUrl('CleanerJobs')}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-amber-50 text-amber-700"
              >
                <Zap className="w-5 h-5 text-amber-500" />
                閃電任務地圖
              </Link>
              <Link
                to={createPageUrl('CleanerSchedule')}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                <ClipboardList className="w-5 h-5 text-stone-400" />
                我的行程
              </Link>
              <Link
                to={createPageUrl('CleanerProfile')}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                <User className="w-5 h-5 text-stone-400" />
                個人資料
              </Link>
              <Link
                to={createPageUrl('ClientDashboard')}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                <Home className="w-5 h-5 text-stone-400" />
                前台（客戶視角）
              </Link>
            </nav>

            {/* 登出 */}
            <div className="p-4 border-t border-stone-100">
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-50 w-full"
              >
                <LogOut className="w-5 h-5" />
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