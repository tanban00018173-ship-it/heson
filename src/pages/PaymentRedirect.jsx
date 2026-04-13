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
      const returnUrl = `${window.location.origin}/PaymentResult`;
      const res = await base44.functions.invoke('ecpayCreateOrder', {
        booking_id: bookingId,
        amount: Number(amount),
        item_name: itemName,
        return_url: returnUrl,
      });

      const { formHtml } = res.data;
      // 建立隱藏的 iframe 並自動提交到綠界
      const div = document.createElement('div');
      div.innerHTML = formHtml;
      document.body.appendChild(div);
    };

    createPayment().catch(e => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">付款初始化失敗：{error}</p>
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