import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { items, removeItem, updateQty, totalCount, totalPrice, open, setOpen } = useCart();
  const navigate = useNavigate();

  if (!open) return null;

  const handleCheckout = () => {
    setOpen(false);
    navigate('/ClientBooking');
  };

  return (
    <>
      {/* overlay */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setOpen(false)} />
      {/* drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 pb-3 pt-1 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-stone-900">購物車</span>
            {totalCount > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{totalCount} 項</span>
            )}
          </div>
          <button onClick={() => setOpen(false)}>
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-stone-300">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm text-stone-400">購物車是空的</p>
            </div>
          )}
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-stone-50 rounded-2xl p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 truncate">{item.name}</p>
                <p className="text-xs text-stone-400">NT${item.price.toLocaleString()} / {item.unit || '次'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.id, item.qty - 1)}
                  className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-100"
                >
                  <Minus className="w-3 h-3 text-stone-600" />
                </button>
                <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.id, item.qty + 1)}
                  className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-100"
                >
                  <Plus className="w-3 h-3 text-stone-600" />
                </button>
              </div>
              <button onClick={() => removeItem(item.id)} className="ml-1 p-1 hover:text-red-500 text-stone-300 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="px-5 pb-8 pt-3 border-t border-stone-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-stone-500">合計</span>
              <span className="text-xl font-bold text-stone-900">NT${totalPrice.toLocaleString()}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-4 rounded-2xl transition-colors text-sm"
            >
              前往預約 / 結帳
            </button>
          </div>
        )}
      </div>
    </>
  );
}