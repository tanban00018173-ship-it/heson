/**
 * HESON Role Router
 * 登入後依 role 自動導向對應入口
 */

export const ROLE_HOME = {
  admin: '/AdminSchedule',
  cleaner: '/CleanerJobs',
  user: '/Home',
};

/**
 * 取得該 role 的預設首頁路徑
 */
export function getRoleHome(role) {
  return ROLE_HOME[role] || '/Home';
}

/**
 * 判斷當前路徑是否屬於該 role 的入口
 */
export function isPortalPath(pathname, role) {
  if (role === 'admin') return pathname.startsWith('/Admin') || pathname.startsWith('/InternalSpreadsheet') || pathname.startsWith('/PartTime') || pathname.startsWith('/CleanerManagement') || pathname.startsWith('/GoogleSheets') || pathname.startsWith('/SheetSync') || pathname.startsWith('/ServiceCase');
  if (role === 'cleaner') return pathname.startsWith('/Cleaner');
  return pathname.startsWith('/Client') || pathname.startsWith('/MyBookings') || pathname.startsWith('/BookingForm');
}