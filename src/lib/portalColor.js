/**
 * 根據「目前台端」和「身份」決定「我的」icon 的顏色
 * 顏色代表雙擊後會去的地方：
 *   藍色 → 中台（夥伴）
 *   紅色 → 後台（總部）
 *   金色 → 前台（有 Premium 訂閱）
 *   黑色 → 前台（一般）
 *   null  → 沒有多台端權限，不顯示特殊色
 */

// portal 判斷：目前在哪個台端
export function getCurrentPortal(pathname) {
  if (pathname.startsWith('/Admin') || pathname.startsWith('/admin')) return 'admin';
  if (
    pathname.startsWith('/Cleaner') ||
    pathname.startsWith('/cleaner') ||
    pathname === '/CleanerJobs'
  ) return 'cleaner';
  return 'client';
}

// 雙擊後要去哪
export function getNextPortalPath(portal, role) {
  if (portal === 'client') return '/CleanerJobs';           // 前台 → 中台
  if (portal === 'cleaner') return role === 'admin' ? '/AdminDashboard' : '/Home';  // 中台 → 後台(admin) 或 前台
  if (portal === 'admin') return '/Home';                   // 後台 → 前台
  return '/Home';
}

// 返回 Tailwind 顏色 class（icon 用）
// hasPremium: clientProfile?.subscription_plan 不為 '無' 或 undefined
export function getPortalIconColor(portal, role, hasPremium = false) {
  if (portal === 'client') {
    if (role === 'admin' || role === 'cleaner') return 'blue';
    return null; // 無多台端權限
  }
  if (portal === 'cleaner') {
    if (role === 'admin') return 'red';
    // cleaner 回前台，有 premium 顯示金色
    if (hasPremium) return 'gold';
    return 'black';
  }
  if (portal === 'admin') {
    return 'black'; // 後台 → 前台（黑色）
  }
  return null;
}

// 顏色對應的 Tailwind class
export const COLOR_CLASSES = {
  blue:  'text-blue-800',
  red:   'text-red-800',
  gold:  'text-amber-500',
  black: 'text-stone-900',
};