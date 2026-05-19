/**
 * 四大類角色權限定義
 *
 * 後台：operator（操作者）、manager（管理員）、member（成員）
 * 中台：cleaner（師傅）、helper（小幫手）
 * 前台：vip（會員）、user（用戶）
 * 封禁：banned_ip（BanIP）、suspended（停權）
 */

// 角色分類結構
export const ROLE_CATEGORIES = [
  {
    key: 'backend',
    label: '後台',
    color: 'amber',
    roles: [
      { key: 'operator', label: '操作者', color: 'bg-amber-100 text-amber-800' },
      { key: 'manager',  label: '管理員', color: 'bg-blue-100 text-blue-700' },
      { key: 'member',   label: '成員',   color: 'bg-stone-100 text-stone-600' },
    ],
  },
  {
    key: 'midend',
    label: '中台',
    color: 'teal',
    roles: [
      { key: 'cleaner', label: '師傅',   color: 'bg-teal-100 text-teal-700' },
      { key: 'helper',  label: '小幫手', color: 'bg-cyan-100 text-cyan-700' },
    ],
  },
  {
    key: 'frontend',
    label: '前台',
    color: 'violet',
    roles: [
      { key: 'vip',  label: '會員', color: 'bg-violet-100 text-violet-700' },
      { key: 'user', label: '用戶', color: 'bg-gray-100 text-gray-600' },
    ],
  },
  {
    key: 'banned',
    label: '封禁',
    color: 'red',
    roles: [
      { key: 'banned_ip',  label: 'BanIP', color: 'bg-red-100 text-red-700' },
      { key: 'suspended',  label: '停權',  color: 'bg-rose-100 text-rose-700' },
    ],
  },
];

// 所有角色扁平化 map
export const ALL_ROLES = ROLE_CATEGORIES.flatMap(c => c.roles);
export const ROLE_MAP = Object.fromEntries(ALL_ROLES.map(r => [r.key, r]));

// 後台等級（admin role 才用）
export const ADMIN_LEVELS = {
  member:   '成員',
  manager:  '管理員',
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

export const DEFAULT_PERMISSIONS = {
  member: {
    bookings: true, dispatch: false, cleaners: false,
    clients: true,  finance: false,  tools: false,
    users: false,   settings: false,
  },
  manager: {
    bookings: true, dispatch: true, cleaners: true,
    clients: true,  finance: true,  tools: true,
    users: false,   settings: false,
  },
  operator: {
    bookings: true, dispatch: true, cleaners: true,
    clients: true,  finance: true,  tools: true,
    users: true,    settings: true,
  },
};

export function resolvePermissions(adminUser) {
  const level = adminUser?.admin_level || 'member';
  const defaults = DEFAULT_PERMISSIONS[level] || DEFAULT_PERMISSIONS.member;
  const overrides = adminUser?.admin_permissions || {};
  return { ...defaults, ...overrides };
}

export function hasPermission(adminUser, key) {
  return resolvePermissions(adminUser)[key] === true;
}