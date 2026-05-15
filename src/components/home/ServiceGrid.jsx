import React from 'react';
import { Home, Snowflake, LayoutGrid, Building2, Sofa, Hammer, Check } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { toast } from 'sonner';

const SERVICES = [
  { id: 'svc_home',    name: '居家清潔', sub: '鐘點・定期・大掃除', Icon: Home,      price: 2800 },
  { id: 'svc_appliance', name: '家電清洗', sub: '冷氣・洗衣機・油煙機', Icon: Snowflake, price: 1500 },
  { id: 'svc_organize', name: '整理收納', sub: '整理師・空間規劃',    Icon: LayoutGrid, price: 3000 },
  { id: 'svc_biz',     name: '商業清潔', sub: '辦公室・商業空間',    Icon: Building2,  price: 5000 },
  { id: 'svc_fabric',  name: '布面清洗', sub: '沙發・床墊・窗簾',    Icon: Sofa,       price: 2000 },
  { id: 'svc_renovation', name: '裝潢後清潔', sub: '新屋・工程後清潔', Icon: Hammer,   price: 6000 },
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
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">服務項目</p>
      <div className="grid grid-cols-2 gap-3">
        {SERVICES.map((svc) => {
          const added = isInCart(svc.id);
          return (
            <button
              key={svc.id}
              onClick={() => handleAdd(svc)}
              className={`relative text-left rounded-2xl p-4 border transition-all duration-200 active:scale-95 ${
                added
                  ? 'bg-amber-50 border-amber-300 shadow-sm'
                  : 'bg-white border-stone-100 hover:border-amber-200 hover:shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${added ? 'bg-amber-100' : 'bg-stone-100'}`}>
                <svc.Icon className={`w-5 h-5 ${added ? 'text-amber-600' : 'text-stone-500'}`} />
              </div>
              <p className={`text-sm font-semibold leading-tight ${added ? 'text-amber-800' : 'text-stone-800'}`}>
                {svc.name}
              </p>
              <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{svc.sub}</p>
              <p className={`text-xs font-bold mt-2 ${added ? 'text-amber-600' : 'text-stone-500'}`}>
                起 NT${svc.price.toLocaleString()}
              </p>
              {added && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}