import React from 'react';
import { Home, Snowflake, LayoutGrid, Building2, Sofa, Hammer, Check } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { toast } from 'sonner';

const SERVICES = [
  { id: 'svc_home',    name: '居家清潔', sub: '鐘點・定期・大掃除', Icon: Home,      price: 2800, tag: '最熱門', tagColor: 'bg-gold-500' },
  { id: 'svc_appliance', name: '家電清洗', sub: '冷氣・洗衣機・油煙機', Icon: Snowflake, price: 1500, tag: '高CP值', tagColor: 'bg-sky-500' },
  { id: 'svc_organize', name: '整理收納', sub: '整理師・空間規劃',    Icon: LayoutGrid, price: 3000, tag: null },
  { id: 'svc_biz',     name: '商業清潔', sub: '辦公室・商業空間',    Icon: Building2,  price: 5000, tag: null },
  { id: 'svc_fabric',  name: '布面清洗', sub: '沙發・床墊・窗簾',    Icon: Sofa,       price: 2000, tag: null },
  { id: 'svc_renovation', name: '裝潢後清潔', sub: '新屋・工程後清潔', Icon: Hammer,   price: 6000, tag: '限量名額', tagColor: 'bg-rose-500' },
];

export default function ServiceGrid() {
  const { addItem, items } = useCart();

  const isInCart = (id) => items.some(i => i.id === id);

  const handleAdd = (svc) => {
    addItem({ id: svc.id, name: svc.name, price: svc.price, unit: '次' });
    toast.success(`已加入：${svc.name}`, { duration: 1500 });
  };

  return (
    <section className="px-4 pt-5 pb-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-stone-700">選擇服務</p>
        <p className="text-xs text-stone-400">點選加入購物車</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {SERVICES.map((svc) => {
          const added = isInCart(svc.id);
          return (
            <button
              key={svc.id}
              onClick={() => handleAdd(svc)}
              className={`relative text-left rounded-2xl p-4 border-2 transition-all duration-200 active:scale-95 shadow-sm ${
                added
                  ? 'bg-gold-50 border-gold-400 shadow-gold-100'
                  : 'bg-white border-stone-100 hover:border-gold-300 hover:shadow-md'
              }`}
            >
              {/* badge */}
              {svc.tag && !added && (
                <span className={`absolute top-3 right-3 ${svc.tagColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full`}>
                  {svc.tag}
                </span>
              )}
              {added && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              )}

              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${added ? 'bg-gold-100' : 'bg-stone-50 border border-stone-100'}`}>
                <svc.Icon className={`w-5 h-5 ${added ? 'text-gold-600' : 'text-stone-500'}`} />
              </div>
              <p className={`text-sm font-bold leading-tight ${added ? 'text-gold-800' : 'text-stone-800'}`}>
                {svc.name}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">{svc.sub}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-[10px] text-stone-400">起</span>
                <span className={`text-sm font-black ${added ? 'text-gold-600' : 'text-stone-700'}`}>
                  NT${svc.price.toLocaleString()}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}