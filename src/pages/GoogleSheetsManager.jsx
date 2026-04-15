import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, CheckCircle2, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleSheetsManager() {
  const [spreadsheetId, setSpreadsheetId] = useState('1lQc70QbKE0U_BvG7LNa_iR9AymWzO4y5g4SkDo0LtHY');
  const [prompt, setPrompt] = useState('');
  const [dataFormat, setDataFormat] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: logs = [] } = useQuery({
    queryKey: ['googleSheetLogs'],
    queryFn: () => base44.entities.GoogleSheetLog.list('-created_date', 50),
    initialData: []
  });

  const fillMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('fillGoogleSheets', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('✓ 資料已填寫，請檢視操作日誌');
      queryClient.invalidateQueries({ queryKey: ['googleSheetLogs'] });
      setPrompt('');
      setDataFormat('');
    },
    onError: (error) => {
      toast.error(`✗ 填寫失敗: ${error.message}`);
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ logId, approve }) => {
      await base44.entities.GoogleSheetLog.update(logId, {
        status: approve ? 'success' : 'failed',
        approved_by: (await base44.auth.me()).email,
        approved_at: new Date().toISOString(),
        approval_required: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['googleSheetLogs'] });
      toast.success('操作已更新');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error('請輸入提示文本');
      return;
    }
    setIsSubmitting(true);
    fillMutation.mutate({
      spreadsheet_id: spreadsheetId,
      spreadsheet_name: '客戶資料表',
      sheet_name: 'Sheet1',
      prompt: prompt.trim(),
      data_format: dataFormat.trim()
    });
    setIsSubmitting(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4" />;
      case 'pending_review': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Google 表格自動填寫</h1>
          <p className="text-stone-600 mt-2">透過 AI 智能填寫 Google 表格，並記錄每次操作以便追蹤和復原</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 填寫表單 */}
          <div className="md:col-span-1">
            <Card className="border-0 shadow-lg sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">AI 自動填寫</CardTitle>
                <CardDescription>輸入要求，AI 會自動生成和填寫資料</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="spreadsheet">表格 ID</Label>
                    <Input
                      id="spreadsheet"
                      value={spreadsheetId}
                      onChange={(e) => setSpreadsheetId(e.target.value)}
                      className="text-sm"
                      placeholder="Google 表格 ID"
                    />
                    <p className="text-xs text-stone-400 mt-1">
                      從表格 URL 複製 ID
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="prompt">填寫需求 *</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="例如：填寫一個客戶記錄，包含姓名、電話、地址、服務日期等資訊"
                      className="min-h-[100px] text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="format">資料格式要求（選填）</Label>
                    <Textarea
                      id="format"
                      value={dataFormat}
                      onChange={(e) => setDataFormat(e.target.value)}
                      placeholder="例如：電話格式：09xx-xxx-xxx，日期格式：YYYY-MM-DD，金額使用逗號分隔"
                      className="min-h-[80px] text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || fillMutation.isPending}
                    className="w-full bg-stone-800 hover:bg-stone-900"
                  >
                    {isSubmitting || fillMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        處理中...
                      </>
                    ) : (
                      '發送給 AI 填寫'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 操作日誌 */}
          <div className="md:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  操作記錄（追蹤和復原）
                </CardTitle>
                <CardDescription>所有 AI 填寫操作都會被記錄，支援復原</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-stone-500 text-center py-8">尚無操作記錄</p>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="border border-stone-200 rounded-lg p-4 bg-white hover:bg-stone-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(log.status)}
                              <span className="font-medium text-stone-900">
                                {log.operation_type === 'ai_fill' ? 'AI 自動填寫' : log.operation_type}
                              </span>
                              <Badge className={getStatusColor(log.status)}>
                                {log.status === 'success' ? '已確認' : log.status === 'pending_review' ? '待審核' : '已失敗'}
                              </Badge>
                            </div>
                            <p className="text-xs text-stone-500">
                              {new Date(log.created_date).toLocaleString('zh-TW')}
                            </p>
                          </div>
                        </div>

                        {log.notes && (
                          <p className="text-sm text-stone-600 mb-3 bg-stone-50 p-2 rounded">
                            {log.notes}
                          </p>
                        )}

                        {log.data_filled && (
                          <details className="mb-3">
                            <summary className="text-xs font-medium text-stone-700 cursor-pointer hover:text-stone-900">
                              查看填入資料
                            </summary>
                            <pre className="text-xs bg-stone-900 text-stone-100 p-2 rounded mt-2 overflow-x-auto max-h-[150px]">
                              {JSON.stringify(log.data_filled, null, 2)}
                            </pre>
                          </details>
                        )}

                        {log.ai_prompt && (
                          <details className="mb-3">
                            <summary className="text-xs font-medium text-stone-700 cursor-pointer hover:text-stone-900">
                              查看 AI 提示
                            </summary>
                            <p className="text-xs text-stone-600 bg-stone-50 p-2 rounded mt-2">
                              {log.ai_prompt}
                            </p>
                          </details>
                        )}

                        {log.approval_required && log.status === 'pending_review' && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-stone-200">
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate({ logId: log.id, approve: true })}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                            >
                              ✓ 批准
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveMutation.mutate({ logId: log.id, approve: false })}
                              className="flex-1 text-xs"
                            >
                              ✗ 拒絕
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 說明 */}
        <Card className="border-0 shadow-lg mt-6 bg-blue-50 border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-base">使用說明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-stone-700">
            <p>✓ 每次 AI 填寫都會記錄到操作日誌，包括填寫的資料、提示文本和 AI 回應</p>
            <p>✓ 您可以查看詳細資料並決定是否批准該操作</p>
            <p>✓ 拒絕的操作不會生效，可以防止 AI 理解錯誤導致的資料損壞</p>
            <p>✓ 所有操作都有時間戳記，便於追蹤和復原</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}