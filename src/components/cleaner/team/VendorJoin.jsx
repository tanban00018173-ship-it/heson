import React, { useState } from 'react';
import { ArrowLeft, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function VendorJoin({ user, onBack, inline }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);

  // 申請成為廠商合作夥伴
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyForm, setApplyForm] = useState({ company: '', contact: '', phone: '', email: '', note: '' });
  const [applyMsg, setApplyMsg] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const qc = useQueryClient();

  // 已申請或已加入的廠商
  const { data: myMembers = [] } = useQuery({
    queryKey: ['vendor_members_mine', user?.id],
    queryFn: () => base44.entities.VendorMember.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const vendors = await base44.entities.Vendor.filter({ code: code.trim() });
      if (!vendors.length) throw new Error('找不到此代碼對應的廠商');
      const vendor = vendors[0];
      const already = myMembers.find(m => m.vendor_id === vendor.id);
      if (already) throw new Error('您已申請或加入此廠商');
      await base44.entities.VendorMember.create({
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        user_id: user.id,
        user_name: user.full_name || user.email,
        status: 'pending',
      });
      return vendor.name;
    },
    onSuccess: (name) => {
      setMsg({ type: 'ok', text: `已送出申請加入「${name}」，等待管理員審核` });
      setCode('');
      qc.invalidateQueries(['vendor_members_mine']);
    },
    onError: (e) => setMsg({ type: 'err', text: e.message }),
  });


  return (
    <div className={inline ? '' : 'flex-1 overflow-y-auto bg-white'}>
      {!inline && (
        <div className="bg-black px-5 pt-8 pb-5 text-white flex items-center gap-3">
          <button onClick={onBack}><ArrowLeft className="w-5 h-5 text-white/60" /></button>
          <span className="font-bold text-lg">廠商群聊</span>
        </div>
      )}

      <div className={inline ? 'pt-3' : 'p-4'}>
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.type === 'ok' ? 'bg-stone-50 text-stone-700 border border-stone-200' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {msg.text}
          </div>
        )}

        <div className="space-y-4">
            <p className="text-xs text-stone-400">輸入廠商管理員提供的代碼，申請加入廠商群聊</p>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="輸入廠商代碼..."
                className="flex-1 bg-stone-100 rounded-xl px-4 py-3 text-sm outline-none"
              />
              <button
                onClick={() => joinMutation.mutate()}
                disabled={!code.trim() || joinMutation.isPending}
                className="px-5 py-3 bg-black text-white rounded-xl text-sm font-semibold disabled:opacity-40">
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* 申請成為廠商合作夥伴 */}
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <button
                onClick={() => { setShowApplyForm(v => !v); setApplyMsg(null); }}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors">
                <span className="text-xs text-stone-500">
                  還沒有廠商代碼？<span className="text-stone-800 font-medium underline underline-offset-2 ml-1">申請成為廠商合作夥伴</span>
                </span>
                {showApplyForm ? <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />}
              </button>

              {showApplyForm && (
                <div className="px-4 pb-4 pt-1 border-t border-stone-100 space-y-2 bg-stone-50">
                  {applyMsg && (
                    <div className={`px-3 py-2 rounded-lg text-xs ${applyMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                      {applyMsg.text}
                    </div>
                  )}
                  <input value={applyForm.company} onChange={e => setApplyForm(f => ({...f, company: e.target.value}))}
                    placeholder="公司／廠商名稱（必填）"
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none" />
                  <input value={applyForm.contact} onChange={e => setApplyForm(f => ({...f, contact: e.target.value}))}
                    placeholder="聯絡人姓名（必填）"
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none" />
                  <input value={applyForm.phone} onChange={e => setApplyForm(f => ({...f, phone: e.target.value}))}
                    placeholder="聯絡電話"
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none" />
                  <input value={applyForm.email} onChange={e => setApplyForm(f => ({...f, email: e.target.value}))}
                    placeholder="電子信箱"
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none" />
                  <textarea value={applyForm.note} onChange={e => setApplyForm(f => ({...f, note: e.target.value}))}
                    placeholder="備註（選填）"
                    rows={2}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none resize-none" />
                  <button
                    disabled={!applyForm.company.trim() || !applyForm.contact.trim() || applyLoading}
                    onClick={async () => {
                      setApplyLoading(true);
                      setApplyMsg(null);
                      await base44.integrations.Core.SendEmail({
                        to: 'heson.tw@gmail.com',
                        subject: `【廠商合作申請】${applyForm.company}`,
                        body: `廠商合作申請\n\n公司名稱：${applyForm.company}\n聯絡人：${applyForm.contact}\n電話：${applyForm.phone || '—'}\nEmail：${applyForm.email || '—'}\n備註：${applyForm.note || '—'}\n\n申請人帳號：${user?.email || '—'}`,
                      });
                      setApplyMsg({ type: 'ok', text: '申請已送出，我們會盡快與您聯繫！' });
                      setApplyForm({ company: '', contact: '', phone: '', email: '', note: '' });
                      setApplyLoading(false);
                    }}
                    className="w-full py-2.5 bg-black text-white rounded-lg text-sm font-semibold disabled:opacity-40">
                    {applyLoading ? '送出中...' : '送出申請'}
                  </button>
                </div>
              )}
            </div>

            {myMembers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-400 mb-2">我的申請紀錄</p>
                {myMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3 bg-stone-50 rounded-xl border border-stone-100 mb-2">
                    <span className="text-sm text-stone-700">{m.vendor_name}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      m.status === 'approved' ? 'bg-black text-white' :
                      m.status === 'rejected' ? 'bg-red-100 text-red-500' :
                      'bg-stone-200 text-stone-500'
                    }`}>
                      {m.status === 'approved' ? '已加入' : m.status === 'rejected' ? '已拒絕' : '審核中'}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}