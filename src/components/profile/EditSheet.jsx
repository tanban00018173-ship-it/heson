import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';

// ── Wheel column for date picker ──────────────────────────────────────────
function WheelColumn({ items, selected, onSelect }) {
  const ITEM_H = 44;
  const ref = useRef(null);

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (ref.current && idx >= 0) ref.current.scrollTop = idx * ITEM_H;
  }, [selected, items]);

  const handleScroll = () => {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    if (items[idx] !== undefined) onSelect(items[idx]);
  };

  return (
    <div className="relative flex-1 overflow-hidden" style={{ height: ITEM_H * 5 }}>
      <div className="absolute left-0 right-0 pointer-events-none z-10"
        style={{ top: ITEM_H * 2, height: ITEM_H, background: 'rgba(0,0,0,0.06)', borderRadius: 10 }} />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="overflow-y-scroll h-full scrollbar-hide snap-y snap-mandatory"
        style={{ scrollSnapType: 'y mandatory', paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2 }}
      >
        {items.map(item => (
          <div
            key={item}
            className="snap-center flex items-center justify-center text-sm font-medium text-stone-800 cursor-pointer"
            style={{ height: ITEM_H }}
            onClick={() => {
              onSelect(item);
              const idx = items.indexOf(item);
              ref.current.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function DateWheelPicker({ value, onChange }) {
  const now = new Date();
  const parsed = value ? value.split('-') : [];
  const [year, setYear] = useState(parsed[0] || String(now.getFullYear() - 25));
  const [month, setMonth] = useState(parsed[1] || '01');
  const [day, setDay] = useState(parsed[2] || '01');

  const years = Array.from({ length: 80 }, (_, i) => String(now.getFullYear() - 5 - i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));

  useEffect(() => { onChange(`${year}-${month}-${day}`); }, [year, month, day]);
  useEffect(() => {
    if (Number(day) > daysInMonth) setDay(String(daysInMonth).padStart(2, '0'));
  }, [month, year]);

  return (
    <div className="flex gap-2 items-center px-2">
      <WheelColumn items={years} selected={year} onSelect={setYear} />
      <span className="text-stone-400 text-sm">年</span>
      <WheelColumn items={months} selected={month} onSelect={setMonth} />
      <span className="text-stone-400 text-sm">月</span>
      <WheelColumn items={days} selected={day} onSelect={setDay} />
      <span className="text-stone-400 text-sm">日</span>
    </div>
  );
}

// ── Select picker (for city/district/radio options) ───────────────────────
function SelectPicker({ options, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${value === opt ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'}`}
        >
          {opt}
          {value === opt && <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-white" /></div>}
        </button>
      ))}
    </div>
  );
}

// ── Dropdown select (for city/district with many options) ─────────────────
function DropdownPicker({ options, value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 appearance-none bg-white pr-10"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
    </div>
  );
}

/**
 * EditSheet — reusable bottom-sheet editor
 *
 * inputType:
 *   'text' | 'tel' | 'number' — plain input
 *   'date'                    — wheel date picker
 *   'select'                  — radio-style buttons (pass options=[])
 *   'dropdown'                — native select (pass options=[])
 *   'select-gender'           — shorthand for gender radio
 */
export default function EditSheet({ open, title, value, onClose, onSave, inputType = 'text', placeholder = '', options = [] }) {
  const [draft, setDraft] = useState(value || '');

  useEffect(() => {
    if (open) setDraft(value || '');
  }, [open, value]);

  if (!open) return null;

  const renderInput = () => {
    if (inputType === 'date') return <DateWheelPicker value={draft} onChange={setDraft} />;
    if (inputType === 'select-gender') return <SelectPicker options={['男', '女', '其他']} value={draft} onChange={setDraft} />;
    if (inputType === 'select') return <SelectPicker options={options} value={draft} onChange={setDraft} />;
    if (inputType === 'dropdown') return <DropdownPicker options={options} value={draft} onChange={setDraft} />;
    return (
      <input
        type={inputType}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
        autoFocus
      />
    );
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
        <div className="relative flex items-center justify-center">
          <h2 className="text-base font-bold text-stone-900">編輯{title}</h2>
          <button onClick={onClose} className="absolute right-0 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 transition-colors">
            <X className="w-4 h-4 text-stone-600" />
          </button>
        </div>
        {renderInput()}
        <button
          onClick={() => onSave(draft)}
          className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl hover:bg-stone-700 transition-colors"
        >
          儲存
        </button>
      </div>
    </div>
  );
}