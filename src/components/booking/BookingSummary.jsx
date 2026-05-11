/**
 * 訂單摘要驗證組件
 * 在提交前顯示所有填寫資訊，確保符合標題要求
 */
import React from 'react';
import { AlertCircle, Check, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BookingSummary({ 
  formData, 
  isOpen, 
  onToggle, 
  onConfirm, 
  isSubmitting 
}) {
  const {
    orderer,
    fullAddress,
    cleaningType,
    servicePlan,
    date,
    timeSlot,
    housingType,
    squareFootage,
    hasPet,
    enhanceAreas,
    notes,
  } = formData;

  // 驗證清單
  const validationChecks = [
    { label: '訂購人姓名', value: orderer.name, required: true },
    { label: '聯絡電話', value: orderer.phone, required: true, pattern: /^09\d{8}$|^\+886\d{9}$/, errorMsg: '電話格式不符（應為 09xxxxxxxx）' },
    { label: '服務地址', value: fullAddress, required: true },
    { label: '清潔類型', value: cleaningType, required: true },
    { label: '服務方案', value: servicePlan, required: true },
    { label: '服務日期', value: date, required: true },
    { label: '服務時段', value: timeSlot, required: true },
  ];

  const errors = validationChecks
    .filter(check => check.required && !check.value)
    .concat(
      validationChecks
        .filter(check => check.pattern && check.value && !check.pattern.test(check.value))
    );

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            {errors.length === 0 ? (
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                <Check className="w-3 h-3 text-green-600" />
              </div>
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="font-semibold text-stone-800">
              {errors.length === 0 ? '✓ 所有必填項已完成' : `⚠ 有 ${errors.length} 項未完成`}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="mt-4 space-y-3 pt-4 border-t border-stone-100">
            {/* 必填項驗證 */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-stone-600 uppercase">必填項檢查</p>
              <div className="space-y-1.5">
                {validationChecks.map((check, idx) => {
                  const hasValue = check.value && String(check.value).trim();
                  const isValid = !check.pattern || !check.value || check.pattern.test(String(check.value));
                  const hasError = check.required && !hasValue;
                  const isWarning = check.pattern && hasValue && !isValid;

                  return (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <div className={`flex-shrink-0 w-4 h-4 rounded-full mt-0.5 flex items-center justify-center text-xs font-bold ${
                        hasError || isWarning
                          ? 'bg-red-100 text-red-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {hasError || isWarning ? '✕' : '✓'}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${hasError || isWarning ? 'text-red-600' : 'text-stone-600'}`}>
                          {check.label}
                        </p>
                        {hasValue && (
                          <p className={`text-xs mt-0.5 ${isWarning ? 'text-red-500' : 'text-stone-500'}`}>
                            {isWarning ? check.errorMsg : String(check.value).substring(0, 50)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 詳細資訊 */}
            <div className="space-y-2 pt-3 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-600 uppercase">詳細資訊</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {housingType && <p className="text-stone-600">🏠 <span className="font-medium">{housingType}</span></p>}
                {squareFootage && <p className="text-stone-600">📐 <span className="font-medium">{squareFootage} 坪</span></p>}
                {hasPet && <p className="text-stone-600">🐾 <span className="font-medium">{hasPet}</span></p>}
                {enhanceAreas.length > 0 && (
                  <p className="col-span-2 text-stone-600">✨ 加強: <span className="font-medium">{enhanceAreas.join('、')}</span></p>
                )}
                {notes && (
                  <p className="col-span-2 text-stone-600">💬 <span className="font-medium">{notes.substring(0, 50)}...</span></p>
                )}
              </div>
            </div>

            {/* 確認按鈕 */}
            <Button
              type="button"
              disabled={errors.length > 0 || isSubmitting}
              onClick={onConfirm}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed"
            >
              {errors.length > 0 ? '請先完成所有必填項' : isSubmitting ? '處理中...' : '確認資料無誤，繼續付款'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}