import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import { IconBroom } from '@/components/home/CleaningIcons';
import FavoriteButton from '@/components/home/FavoriteButton';
import ServiceDetailSheet from '@/components/home/ServiceDetailSheet';

const TYPE_OPTIONS = [
  { value: 'all',        label: '全部' },
  { value: 'flash',      label: '閃電到府' },
  { value: 'recurring',  label: '定期包月' },
  { value: 'deep_clean', label: '細清大掃除' },
  { value: 'appliance',  label: '家電清洗' },
  { value: 'fabric',     label: '布面清洗' },
  { value: 'organize',   label: '整理收納' },
];

const PRICE_OPTIONS = [
  { value: 'all',       label: '全部',      min: 0,    max: Infinity },
  { value: 'under500',  label: '500 以下',  min: 0,    max: 500 },
  { value: '500-1000',  label: '500-1000',  min: 500,  max: 1000 },
  { value: '1000-2000', label: '1000-2000', min: 1000, max: 2000 },
  { value: 'over2000',  label: '2000 以上', min: 2000, max: Infinity },
];

const SORT_OPTIONS = [
  { value: 'popular',    label: '熱門優先' },
  { value: 'booking',    label: '預約最多' },
  { value: 'latest',     label: '最新上架' },
  { value: 'price_asc',  label: '價格低到高' },
  { value: 'price_desc', label: '價格高到低' },
];

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full font-medium transition-all ${
        active
          ? 'bg-stone-900 text-white'
          : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
      }`}
    >
      {children}
    </button>
  );
}

function FilterRow({ label, options, value, onChange }) {
  return (
    <div className="px-4 py-2">
      <p className="text-[11px] font-bold text-stone-400 mb-1.5">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {options.map(opt => (
          <FilterPill key={opt.value} active={value === opt.value} onClick={() => onChange(opt.value)}>
            {opt.label}
          </FilterPill>
        ))}
      </div>
    </div>
  );
}

function ServiceCard({ item, providerPhoto, onOpen }) {
  return (
    <div
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm active:scale-95 transition-transform cursor-pointer"
    >
      <div className="h-32 bg-stone-100 flex items-center justify-center relative overflow-hidden">
        {item.image_url
          ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          : <IconBroom className="w-12 h-12" />}
        {item.badge && (
          <span className="absolute top-2 right-2 bg-white/90 text-stone-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
        <div className="absolute top-2 left-2">
          <FavoriteButton item={item} />
        </div>
      </div>
      <div className="p-3 flex gap-2">
        {providerPhoto ? (
          <img src={providerPhoto} alt="" className="w-10 h-10 rounded-full object-cover border border-stone-100 flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
            <span className="text-base">🧹</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-stone-900 leading-snug line-clamp-2">{item.title}</p>
          <p className="text-[11px] text-stone-400 mt-0.5 leading-tight line-clamp-1">{item.subtitle}</p>
          {item.price != null && (
            <p className="text-sm font-bold text-stone-900 mt-1">NT$ {item.price.toLocaleString()} 起</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ServiceBrowse() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedService, setSelectedService] = useState(null);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['browseSections'],
    queryFn: () => base44.entities.HomeSection.filter({ is_active: true }, 'sort_order', 200),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['browseProfiles'],
    queryFn: () => base44.entities.CleanerProfile.filter({ is_active: true }, '-created_date', 50),
  });

  const priceRange = PRICE_OPTIONS.find(p => p.value === priceFilter);

  const filtered = useMemo(() => {
    let list = [...sections];

    if (typeFilter !== 'all') {
      list = list.filter(s => s.section_key === typeFilter);
    }

    if (priceFilter !== 'all' && priceRange) {
      list = list.filter(s => s.price != null && s.price >= priceRange.min && s.price < priceRange.max);
    }

    if (sortBy === 'popular') {
      list.sort((a, b) => ((b.click_count || 0) + (b.booking_count || 0)) - ((a.click_count || 0) + (a.booking_count || 0)));
    } else if (sortBy === 'booking') {
      list.sort((a, b) => (b.booking_count || 0) - (a.booking_count || 0));
    } else if (sortBy === 'latest') {
      list.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return list;
  }, [sections, typeFilter, priceFilter, priceRange, sortBy]);

  const hasActiveFilter = typeFilter !== 'all' || priceFilter !== 'all' || sortBy !== 'popular';

  const clearFilters = () => {
    setTypeFilter('all');
    setPriceFilter('all');
    setSortBy('popular');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-stone-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-stone-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4" />
              服務篩選
            </h1>
          </div>
          {hasActiveFilter && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800">
              <X className="w-3.5 h-3.5" />
              清除
            </button>
          )}
        </div>

        <div className="pb-2 space-y-1 bg-stone-50/50">
          <FilterRow label="清潔類型" options={TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} />
          <FilterRow label="價格區間" options={PRICE_OPTIONS} value={priceFilter} onChange={setPriceFilter} />
          <FilterRow label="排序方式" options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
        </div>

        <div className="px-4 py-2 border-t border-stone-100 bg-white">
          <p className="text-xs text-stone-400">
            {isLoading ? '載入中…' : `共 ${filtered.length} 項服務`}
          </p>
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm">沒有符合篩選條件的服務</p>
            <button onClick={clearFilters} className="mt-4 px-5 py-2 bg-stone-900 text-white text-xs rounded-full">
              清除篩選條件
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(item => {
              const provider = profiles.find(p => p.user_id === item.provider_id);
              return (
                <ServiceCard
                  key={item.id}
                  item={item}
                  providerPhoto={provider?.profile_photo}
                  onOpen={setSelectedService}
                />
              );
            })}
          </div>
        )}
      </div>

      {selectedService && (
        <ServiceDetailSheet item={selectedService} onClose={() => setSelectedService(null)} />
      )}
    </div>
  );
}