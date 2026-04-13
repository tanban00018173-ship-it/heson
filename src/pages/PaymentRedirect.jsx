import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PaymentRedirect() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('booking_id');
    const amount = params.get('amount');
    const itemName = params.get('item_name') || 'HESON居家清潔服務';

    if (!bookingId || !amount) {
      setError('缺少必要參數');
      return;
    }

    const createPayment = async () => {
      try {
        const returnUrl = `${window.location.origin}/PaymentResult`;
        const res = await base44.functions.invoke('ecpayCreateOrder', {
          booking_id: bookingId,
          amount: Number(amount),
          item_name: itemName,
          return_url: returnUrl,
        });

        const { formHtml } = res.data;
        // 直接寫入完整 HTML，自動提交表單
        document.open();
        document.write(formHtml);
        document.close();
      } catch (err) {
        setError(err.message || '付款初始化失敗，請稍後重試');
      }
    };

    createPayment();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium mb-4">付款初始化失敗</p>
          <p className="text-stone-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-stone-800 hover:bg-stone-900 text-white px-6 py-2 rounded-xl transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
      <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
      <p className="text-stone-600 text-lg">正在連接綠界付款頁面，請稍候...</p>
      <p className="text-stone-400 text-sm mt-2">請勿關閉此頁面</p>
    </div>
  );
}