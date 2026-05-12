import React, { useState } from 'react';
import { Play, CheckCircle2, Lock, Award, ChevronRight, ClipboardCheck } from 'lucide-react';

const SKILLS = [
  { id: 'basic_clean', name: '基礎居家清潔', description: '掌握標準清潔流程與工具使用', icon: '🧹', taskType: '輕量案件', unlocked: true, videoCount: 3, quizPassed: true },
  { id: 'deep_clean', name: '深層細清技術', description: '深層清潔、除垢除黴專業手法', icon: '✨', taskType: '細清案件', unlocked: false, videoCount: 5, quizPassed: false },
  { id: 'rental_clean', name: '民宿旅宿清潔', description: '快速換房流程與品質控制標準', icon: '🏨', taskType: '民宿清潔', unlocked: false, videoCount: 4, quizPassed: false },
  { id: 'construction_clean', name: '毛坯裝潢後清潔', description: '建材粉塵、油漆殘留專業處理', icon: '🏗️', taskType: '毛坯案件', unlocked: false, videoCount: 6, quizPassed: false },
  { id: 'recurring_clean', name: '定期清潔服務', description: '客戶關係維護與定期服務流程', icon: '🔄', taskType: '定清案件', unlocked: true, videoCount: 3, quizPassed: true },
];

export default function SkillsTab() {
  const [activeSkill, setActiveSkill] = useState(null);

  if (activeSkill) {
    const skill = SKILLS.find(s => s.id === activeSkill);
    return (
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="bg-black p-6 text-white">
          <button onClick={() => setActiveSkill(null)} className="text-white/50 text-sm mb-4">← 返回</button>
          <div className="text-4xl mb-2">{skill.icon}</div>
          <h2 className="text-xl font-bold">{skill.name}</h2>
          <p className="text-white/50 text-sm mt-1">{skill.description}</p>
        </div>

        <div className="p-4 space-y-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">課程影片（{skill.videoCount} 集）</p>
          {Array.from({ length: skill.videoCount }, (_, i) => (
            <div key={i} className="bg-stone-50 rounded-xl p-4 flex items-center gap-3 border border-stone-100">
              <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center flex-shrink-0">
                {i < 1 && skill.unlocked ? (
                  <Play className="w-4 h-4 text-black" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-stone-300" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-800">第 {i + 1} 課：{['介紹與準備', '工具使用', '標準流程', '常見問題', '進階技巧', '品質檢查'][i] || '補充教材'}</p>
                <p className="text-xs text-stone-400">{[5,8,6,7,9,5][i] || 5} 分鐘</p>
              </div>
              {i < 1 && skill.unlocked && <ChevronRight className="w-4 h-4 text-stone-300" />}
            </div>
          ))}

          <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="w-4 h-4 text-stone-700" />
              <span className="font-semibold text-stone-800 text-sm">線上測驗</span>
            </div>
            <p className="text-xs text-stone-400 mb-3">完成所有影片後解鎖測驗，通過即可接取此類任務</p>
            <button
              disabled={!skill.unlocked}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                skill.unlocked ? 'bg-black text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {skill.quizPassed ? '✅ 已通過測驗' : skill.unlocked ? '開始測驗' : '請先完成影片'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="bg-black p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-5 h-5" />
          <span className="font-bold text-lg">技能認證</span>
        </div>
        <p className="text-white/50 text-sm">觀看教學影片 → 通過測驗 → 解鎖對應任務</p>
      </div>

      <div className="mx-4 mt-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
        <div className="flex items-center justify-between">
          {[
            { label: '已解鎖', value: SKILLS.filter(s => s.unlocked).length, color: 'text-black' },
            { label: '待解鎖', value: SKILLS.filter(s => !s.unlocked).length, color: 'text-stone-400' },
            { label: '已認證', value: SKILLS.filter(s => s.quizPassed).length, color: 'text-black' },
          ].map(({ label, value, color }, i, arr) => (
            <React.Fragment key={label}>
              <div className="text-center flex-1">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-stone-400">{label}</p>
              </div>
              {i < arr.length - 1 && <div className="w-px h-8 bg-stone-200" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2">
        {SKILLS.map(skill => (
          <button
            key={skill.id}
            onClick={() => setActiveSkill(skill.id)}
            className="w-full text-left bg-white border border-stone-100 rounded-xl p-4 flex items-center gap-4 hover:bg-stone-50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-2xl flex-shrink-0">
              {skill.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-stone-800 text-sm">{skill.name}</p>
                {skill.quizPassed && <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />}
              </div>
              <p className="text-xs text-stone-400 truncate">{skill.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${skill.unlocked ? 'bg-black text-white' : 'bg-stone-100 text-stone-400'}`}>
                  {skill.unlocked ? '已解鎖' : '未解鎖'}
                </span>
                <span className="text-xs text-stone-300">→ {skill.taskType}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}