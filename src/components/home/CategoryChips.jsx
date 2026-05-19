import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconAll, IconClean, IconAppliance, IconFabric, IconOrganize, IconBusiness, IconReno, IconFlash } from './CleaningIcons';

const CATEGORIES = [
  { id: 'all',       Icon: IconAll,       label: '全部',     route: null },
  { id: 'home',      Icon: IconClean,     label: '居家清潔', route: '/ServiceInquiry?service=居家清潔' },
  { id: 'appliance', Icon: IconAppliance, label: '家電清洗', route: '/ServiceInquiry?service=家電清洗' },
  { id: 'fabric',    Icon: IconFabric,    label: '布面清洗', route: '/ServiceInquiry?service=布面清洗' },
  { id: 'organize',  Icon: IconOrganize,  label: '整理收納', route: '/ServiceInquiry?service=整理收納' },
  { id: 'biz',       Icon: IconBusiness,  label: '商業清潔', route: '/ServiceInquiry?service=商業清潔' },
  { id: 'reno',      Icon: IconReno,      label: '裝潢清潔', route: '/ServiceInquiry?service=裝潢後清潔' },
  { id: 'flash',     Icon: IconFlash,     label: '閃電任務', route: '/FlashTaskPost' },
];

const FILTERS = ['首次優惠', '高評分', '10分鐘到', '訂閱方案'];

export default function CategoryChips() {
  const [active, setActive] = useState('all');
  const navigate = useNavigate();

  const handleClick = (cat) => {
    setActive(cat.id);
    if (cat.route) navigate(cat.route);
  };

  return (
    <div className="bg-white border-b border-stone-100">
      <div className="flex overflow-x-auto gap-2 px-4 pb-3 pt-3 scrollbar-none">
        {FILTERS.map((label) => (
          <button
            key={label}
            onClick={() => navigate('/ClientBooking')}
            className="flex items-center px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 transition-colors flex-shrink-0"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}