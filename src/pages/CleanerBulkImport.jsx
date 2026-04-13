import React, { useState, useEffect } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function CleanerBulkImport() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (auth) {
        const u = await base44.auth.me();
        setUser(u);
        if (u.role !== 'admin') window.location.href = '/';
      }
    });
  }, []);

  const parseFile = (selectedFile) => {
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length < 2) {
          toast.error('檔案內容不足');
          return;
        }

        const headers = rows[0];
        const dataRows = rows.slice(1).map((row) => {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = row[i] || '';
          });
          return obj;
        }).filter(r => r['姓名（同身分證）']); // 只保留有姓名的行

        setFile(selectedFile);
        setPreview(dataRows.slice(0, 5));
        toast.success(`讀取 ${dataRows.length} 筆資料`);
      } catch (err) {
        toast.error('檔案解析失敗');
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const mapData = (row) => {
    const serviceAreas = [];
    ['台北', '新北', '基隆', '桃園', '宜蘭', '其他'].forEach((area) => {
      if (row[`您希望的接案地區（${area}）`]) serviceAreas.push(area);
    });

    const serviceTypes = row['您可以承接的服務項目'] ? row['您可以承接的服務項目'].split(/[,，]/).map(s => s.trim()) : [];

    return {
      name: row['姓名（同身分證）'],
      nickname: row['暱稱（用於介紹客戶）'] || row['姓名（同身分證）'],
      gender: row['性別'] || '',
      age: row['年齡'] ? parseInt(row['年齡']) : null,
      phone: row['聯絡電話'],
      line_id: row['LINE ID（方便派單通知）'] || '',
      residence_area: row['居住地區（縣市 + 鄉鎮/市區）'] || '',
      education: row['最高學歷'] || '',
      emergency_contact: row['緊急聯絡人（姓名 + 關係）'] || '',
      emergency_phone: row['緊急聯絡人電話'] || '',
      experience_years: row['您的家事經驗（年資）'] ? parseInt(row['您的家事經驗（年資）']) : 0,
      service_types: serviceTypes,
      pet_acceptance: row['對於寵物的接受程度'] || '',
      has_own_tools: row['您是否自備清潔工具']?.includes('是') || false,
      transportation: row['交通工具'] || '',
      available_hours: row['每週可配合的時段'] || '',
      other_job: row['目前是否還有其他正職/兼職工作'] || '',
      service_areas: serviceAreas,
      expected_hourly_rate: row['期望時薪'] ? parseInt(row['期望時薪']) : null,
      bank_name: row['匯款銀行'] || '',
      bank_account: row['匯款帳號'] || '',
      police_record_verified: row['是否能提供「良民證」（警察刑事紀錄證明書）？ （選填）']?.includes('是') || false,
      id_verified: true,
      is_active: true,
    };
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      toast.error('請先選擇檔案');
      return;
    }

    setLoading(true);
    try {
      // 先讀取整個檔案
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = rows[0];
        const allRows = rows.slice(1).filter(r => r[0]); // 只要有姓名的行

        const cleanders = allRows.map(row => {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = row[i] || '';
          });
          return mapData(obj);
        });

        // 批量建立
        await base44.entities.CleanerProfile.bulkCreate(cleanders);
        toast.success(`已成功匯入 ${cleanders.length} 筆清潔師資料`);
        setImported(true);
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      toast.error('匯入失敗：' + err.message);
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-stone-600">僅管理員可訪問此頁面</p>
      </div>
    );
  }

  if (imported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <CardContent className="pt-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-medium text-stone-800 mb-2">匯入成功！</h2>
            <p className="text-stone-600 mb-6">所有清潔師資料已新增至系統</p>
            <Button
              onClick={() => window.location.href = '/CleanerManagement'}
              className="w-full bg-stone-800 hover:bg-stone-900 rounded-xl"
            >
              前往管理後台
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-stone-800 mb-2">批量匯入清潔師</h1>
          <p className="text-stone-600">上傳 CSV 或 Excel 檔案快速新增多位清潔師</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>上傳檔案</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-stone-300 rounded-xl p-12 text-center hover:border-amber-500 transition-all">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => parseFile(e.target.files?.[0])}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                    <p className="text-lg font-medium text-stone-700 mb-1">點擊上傳或拖入檔案</p>
                    <p className="text-sm text-stone-500">支援 .xlsx, .xls, .csv 格式</p>
                  </label>
                </div>

                {/* Template Download */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium mb-3">下載範本檔案</p>
                  <Button
                    variant="outline"
                    className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      const template = [
                        ['姓名（同身分證）', '性別', '期望時薪', '暱稱（用於介紹客戶）', '年齡', '聯絡電話', 'LINE ID（方便派單通知）', '居住地區（縣市 + 鄉鎮/市區）', '最高學歷', '緊急聯絡人（姓名 + 關係）', '緊急聯絡人電話', '您的家事經驗（年資）', '您可以承接的服務項目', '對於寵物的接受程度', '您是否自備清潔工具', '交通工具', '每週可配合的時段', '目前是否還有其他正職/兼職工作', '您希望的接案地區（台北）', '您希望的接案地區（新北）', '您希望的接案地區（基隆）', '您希望的接案地區（桃園）', '您希望的接案地區（宜蘭）', '您希望的接案地區（其他地區）', '匯款銀行', '匯款帳號'],
                        ['王美麗', '女', '350', '美美', '35', '0912345678', '@wang123', '台北市中山區', '大學', '王先生/父親', '0987654321', '5', '居家清潔,家電清洗', '喜歡', '是', '機車', '週一至週五 09:00-17:00', '否', '是', '是', '', '', '', '', '台灣銀行', '123456789']
                      ];
                      const ws = XLSX.utils.aoa_to_sheet(template);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Cleaners');
                      XLSX.writeFile(wb, '清潔師資料範本.xlsx');
                      toast.success('範本已下載');
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" /> 下載 Excel 範本
                  </Button>
                </div>

                {/* Preview Section */}
                {preview.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-stone-800">資料預覽（前 5 筆）</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {preview.map((row, idx) => (
                        <div key={idx} className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                          <p className="font-medium text-stone-800">
                            {row['暱稱（用於介紹客戶）'] || row['姓名（同身分證）']}
                          </p>
                          <div className="text-xs text-stone-600 mt-1 space-y-0.5">
                            <p>📞 {row['聯絡電話']}</p>
                            <p>💰 時薪 ${row['期望時薪'] || '未指定'}</p>
                            <p>📍 {row['居住地區（縣市 + 鄉鎮/市區）'] || '未指定'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Import Button */}
                {preview.length > 0 && (
                  <Button
                    onClick={handleImport}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        匯入中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        確認匯入
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  說明
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-stone-600 space-y-3">
                <div>
                  <p className="font-medium text-stone-800 mb-1">必填欄位</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>姓名（同身分證）</li>
                    <li>聯絡電話</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-stone-800 mb-1">服務地區</p>
                  <p className="text-xs">在對應的欄位填入「是」或任何文字即可勾選。例：台北欄位填「是」表示願意承接台北市案件。</p>
                </div>
                <div>
                  <p className="font-medium text-stone-800 mb-1">時薪格式</p>
                  <p className="text-xs">直接填數字（如 350）或「400/450(過年)」等說明。系統會自動提取首個數字。</p>
                </div>
                <div>
                  <p className="font-medium text-stone-800 mb-1">布林值</p>
                  <p className="text-xs">勾選欄位（如自備工具）只需填「是」或 true，其他視為否。</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">已匯入統計</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-600 mb-2">
                  {preview.length > 0 ? preview.length : '0'}
                </p>
                <p className="text-sm text-stone-600">筆資料待確認</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}