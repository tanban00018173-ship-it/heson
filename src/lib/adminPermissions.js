/**
 * 後台三級權限定義
 * member   → 成員：只讀，無法修改
 * manager  → 管理員：大部分操作，無法改設定和用戶
 * operator → 操作者：最高權限，可設定所有人的細部權限
 */

export const ADMIN_LEVELS = {
  member: '成員',
  manager: '管理員',
  operator: '操作者',
};

export const PERMISSION_KEYS = [
  { key: 'bookings',  label: '預約管理',   desc: '查看/修改預約' },
  { key: 'dispatch',  label: '派單管理',   desc: '指派管理師' },
  { key: 'cleaners',  label: '管理師管理', desc: '審核/編輯管理師' },
  { key: 'clients',   label: '客戶管理',   desc: '查看/編輯客戶資料' },
  { key: 'finance',   label: '財務管理',   desc: '付款紀錄、退款操作' },
  { key: 'tools',     label: '內部工具',   desc: '試算表、AI 助理' },
  { key: 'users',     label: '人員管理',   desc: '查看後台用戶清單' },
  { key: 'settings',  label: '系統設定',   desc: '權限設定、角色管理' },
];

/** 各等級的預設權限 */
export const DEFAULT_PERMISSIONS = {
  member: {
    bookings: true,
    dispatch: false,
    cleaners: false,
    clients: true,
    finance: false,
    tools: false,
    users: false,
    settings: false,
  },
  manager: {
    bookings: true,
    dispatch: true,
    cleaners: true,
    clients: true,
    finance: true,
    tools: true,
    users: false,
    settings: false,
  },
  operator: {
    bookings: true,
    dispatch: true,
    cleaners: true,
    clients: true,
    finance: true,
    tools: true,
    users: true,
    settings: true,
  },
};

/**
 * 取得某用戶的實際有效權限
 * admin_permissions 中的 key 若存在則覆寫預設值
 */
export function resolvePermissions(adminUser) {
  const level = adminUser?.admin_level || 'member';
  const defaults = DEFAULT_PERMISSIONS[level] || DEFAULT_PERMISSIONS.member;
  const overrides = adminUser?.admin_permissions || {};
  return { ...defaults, ...overrides };
}

/** 快速判斷某用戶是否有某項權限 */
export function hasPermission(adminUser, key) {
  return resolvePermissions(adminUser)[key] === true;
}