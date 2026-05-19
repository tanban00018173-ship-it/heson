/**
 * 清潔相關 SVG icon 集
 * 統一替代 emoji，之後串接師傅/廠商上傳圖片時直接換掉即可
 */

import React from 'react';

/* 居家清潔 */
export function IconHome({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20L24 6L40 20V42H30V30H18V42H8V20Z" fill="#e7e5e4" stroke="#78716c" strokeWidth="2" strokeLinejoin="round"/>
      <rect x="20" y="30" width="8" height="12" rx="1" fill="#a8a29e"/>
    </svg>
  );
}

/* 掃把/清潔 */
export function IconClean({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="14" y1="8" x2="34" y2="38" stroke="#78716c" strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="32" cy="38" rx="8" ry="4" fill="#e7e5e4" stroke="#78716c" strokeWidth="2"/>
      <path d="M10 8 Q14 4 18 8" stroke="#78716c" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

/* 冰箱/家電清洗 */
export function IconAppliance({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="6" width="28" height="36" rx="3" fill="#e7e5e4" stroke="#78716c" strokeWidth="2"/>
      <line x1="10" y1="22" x2="38" y2="22" stroke="#78716c" strokeWidth="2"/>
      <circle cx="32" cy="15" r="2" fill="#78716c"/>
      <circle cx="32" cy="32" r="2" fill="#78716c"/>
    </svg>
  );
}

/* 沙發/布面清洗 */
export function IconFabric({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="20" width="36" height="16" rx="4" fill="#e7e5e4" stroke="#78716c" strokeWidth="2"/>
      <rect x="12" y="16" width="24" height="8" rx="3" fill="#d6d3d1" stroke="#78716c" strokeWidth="2"/>
      <rect x="6" y="20" width="8" height="12" rx="3" fill="#d6d3d1" stroke="#78716c" strokeWidth="2"/>
      <rect x="34" y="20" width="8" height="12" rx="3" fill="#d6d3d1" stroke="#78716c" strokeWidth="2"/>
      <line x1="14" y1="36" x2="14" y2="42" stroke="#78716c" strokeWidth="2" strokeLinecap="round"/>
      <line x1="34" y1="36" x2="34" y2="42" stroke="#78716c" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/* 箱子/整理收納 */
export function IconOrganize({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="18" width="36" height="24" rx="2" fill="#e7e5e4" stroke="#78716c" strokeWidth="2"/>
      <path d="M6 18L10 8H38L42 18" fill="#d6d3d1" stroke="#78716c" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M18 28H30" stroke="#78716c" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/* 辦公大樓/商業清潔 */
export function IconBusiness({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="22" height="34" fill="#e7e5e4" stroke="#78716c" strokeWidth="2"/>
      <rect x="28" y="18" width="14" height="24" fill="#d6d3d1" stroke="#78716c" strokeWidth="2"/>
      <rect x="12" y="14" width="4" height="4" fill="#a8a29e"/>
      <rect x="20" y="14" width="4" height="4" fill="#a8a29e"/>
      <rect x="12" y="22" width="4" height="4" fill="#a8a29e"/>
      <rect x="20" y="22" width="4" height="4" fill="#a8a29e"/>
      <rect x="32" y="24" width="4" height="4" fill="#a8a29e"/>
      <rect x="12" y="30" width="4" height="4" fill="#a8a29e"/>
      <rect x="20" y="30" width="4" height="4" fill="#a8a29e"/>
    </svg>
  );
}

/* 油漆/裝潢清潔 */
export function IconReno({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="26" width="20" height="8" rx="2" fill="#e7e5e4" stroke="#78716c" strokeWidth="2"/>
      <line x1="28" y1="30" x2="38" y2="30" stroke="#78716c" strokeWidth="3" strokeLinecap="round"/>
      <line x1="38" y1="16" x2="38" y2="30" stroke="#78716c" strokeWidth="3" strokeLinecap="round"/>
      <rect x="32" y="8" width="10" height="8" rx="1" fill="#d6d3d1" stroke="#78716c" strokeWidth="2"/>
    </svg>
  );
}

/* 閃電/閃電任務 */
export function IconFlash({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M28 6L12 26H24L20 42L36 22H24L28 6Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

/* 全部 */
export function IconAll({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="18" fill="#e7e5e4" stroke="#78716c" strokeWidth="2"/>
      <path d="M16 20 Q24 12 32 20 Q24 28 16 20Z" fill="#a8a29e"/>
      <circle cx="24" cy="28" r="4" fill="#78716c"/>
    </svg>
  );
}

/* 商店/購物 */
export function IconShop({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20H40L36 40H12L8 20Z" fill="#e7e5e4" stroke="#78716c" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M14 20 Q14 10 24 10 Q34 10 34 20" stroke="#78716c" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <line x1="20" y1="28" x2="28" y2="28" stroke="#78716c" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/* 掃把圖（section 預設圖） */
export function IconBroom({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="10" x2="44" y2="50" stroke="#a8a29e" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="42" cy="50" rx="10" ry="5" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="2"/>
      <path d="M16 10 Q20 5 24 10" stroke="#a8a29e" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

/* 深度清潔圖 */
export function IconDeepClean({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="18" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="3"/>
      <line x1="40" y1="40" x2="54" y2="54" stroke="#a8a29e" strokeWidth="4" strokeLinecap="round"/>
      <path d="M20 28 Q28 18 36 28" stroke="#78716c" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <line x1="28" y1="24" x2="28" y2="36" stroke="#78716c" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/* 退租/鑰匙 */
export function IconMoveOut({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="26" height="30" rx="3" fill="#e7e5e4" stroke="#78716c" strokeWidth="2"/>
      <circle cx="36" cy="22" r="6" fill="#fde68a" stroke="#d97706" strokeWidth="2"/>
      <line x1="36" y1="28" x2="36" y2="38" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
      <line x1="36" y1="34" x2="40" y2="34" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="24" x2="24" y2="24" stroke="#78716c" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="30" x2="28" y2="30" stroke="#78716c" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/* 入住/床鋪 */
export function IconMoveIn({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="26" width="36" height="14" rx="3" fill="#e7e5e4" stroke="#78716c" strokeWidth="2"/>
      <rect x="10" y="18" width="12" height="10" rx="2" fill="#fde68a" stroke="#d97706" strokeWidth="1.5"/>
      <rect x="26" y="18" width="12" height="10" rx="2" fill="#fde68a" stroke="#d97706" strokeWidth="1.5"/>
      <line x1="8" y1="26" x2="40" y2="26" stroke="#78716c" strokeWidth="2"/>
      <line x1="10" y1="40" x2="10" y2="44" stroke="#78716c" strokeWidth="2" strokeLinecap="round"/>
      <line x1="38" y1="40" x2="38" y2="44" stroke="#78716c" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/* 民宿/房務 */
export function IconAirbnb({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 22L24 10L38 22V40H10V22Z" fill="#e7e5e4" stroke="#78716c" strokeWidth="2" strokeLinejoin="round"/>
      <rect x="18" y="28" width="12" height="12" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="1.5"/>
      <rect x="14" y="18" width="5" height="5" rx="1" fill="#a8a29e"/>
      <rect x="29" y="18" width="5" height="5" rx="1" fill="#a8a29e"/>
    </svg>
  );
}

/* 輕量清潔/快速 */
export function IconLight({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="20" r="10" fill="#fde68a" stroke="#d97706" strokeWidth="2"/>
      <path d="M24 10 V6M24 34 V38M10 20 H6M38 20 H42" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="30" x2="24" y2="42" stroke="#78716c" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="40" x2="28" y2="40" stroke="#78716c" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/* 管理師/人物圖 */
export function IconCleaner({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="18" r="10" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="2.5"/>
      <path d="M12 52 Q12 36 32 36 Q52 36 52 52" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="38" y1="38" x2="52" y2="54" stroke="#a8a29e" strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="50" cy="55" rx="6" ry="3" fill="#d6d3d1" stroke="#a8a29e" strokeWidth="2"/>
    </svg>
  );
}

/* 定期清潔 */
export function IconRecurring({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="20" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="3"/>
      <path d="M32 18 A14 14 0 0 1 46 32" stroke="#78716c" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <polyline points="44,28 46,32 50,30" stroke="#78716c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="32" y1="26" x2="32" y2="34" stroke="#a8a29e" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="32" y1="34" x2="38" y2="38" stroke="#a8a29e" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

/* 冷氣/家電清洗 section */
export function IconAC({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="16" width="44" height="18" rx="4" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="2.5"/>
      <line x1="10" y1="24" x2="54" y2="24" stroke="#a8a29e" strokeWidth="1.5"/>
      <line x1="22" y1="34" x2="18" y2="48" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round"/>
      <line x1="32" y1="34" x2="32" y2="48" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round"/>
      <line x1="42" y1="34" x2="46" y2="48" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="46" cy="21" r="3" fill="#a8a29e"/>
    </svg>
  );
}