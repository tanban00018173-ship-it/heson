import React, { useState } from 'react';
import { Play, CheckCircle2, Lock, Award, ChevronRight, BookOpen, ClipboardCheck } from 'lucide-react';

const SKILLS = [
  {
    id: 'basic_clean',
    name: '基礎居家清潔',
    description: '掌握標準清潔流程與工具使用',
    icon: '🧹',
    color: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    taskType: '輕量案件',
    unlocked: true,
    videoCount: 3,
    quizPassed: true,
  },
  {
    id: 'deep_clean',
    name: '深層細清技術',
    description: '深層清潔、除垢除黴專業手法',
    icon: '✨',
    color: 'from-blue-400 to-cyan-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    taskType: '細清案件',
    unlocked: false,
    videoCount: 5,
    quizPassed: false,
  },
  {
    id: 'rental_clean',
    name: '民宿旅宿清潔',
    description: '快速換房流程與品質控制標準',
    icon: '🏨',
    color: 'from-purple-400 to-violet-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    taskType: '民宿清潔',
    unlocked: false,
    videoCount: 4,
    quizPassed: false,
  },
  {
    id: 'construction_clean',
    name: '毛坯裝潢後清潔',
    description: '建材粉塵、油漆殘留專業處理',
    icon: '🏗️',
    color: 'from-orange-400 to-red-400',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    taskType: '毛坯案件',
    unlocked: false,
    videoCount: 6,
    quizPassed: false,
  },
  {
    id: 'recurring_clean',
    name: '定期清潔服務',
    description: '客戶關係維護與定期服務流程',
    icon: '🔄',
    color: 'from-teal-400 to-cyan-500',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    taskType: '定清案件',
    unlocked: true,
    videoCount: 3,
    quizPassed: true,
  },
];

export default function SkillsTab() {
  const [activeSkill, setActiveSkill] = useState(null);

  if (activeSkill) {
    const skill = SKILLS.find(s => s.id === activeSkill);
    return (
      <div className="flex-1 overflow-y-auto bg-stone-50">
        {/* 課程頁 */}
        <div className={`bg-gradient-to-br ${skill.color} p-6 text-white`}>
          <button onClick={() => setActiveSkill(null)} className="text-white/80 text-sm mb-3">← 返回</button>
          <div className="text-4xl mb-2">{skill.icon}</div>
          <h2 className="text-xl font-bold">{skill.name}</h2>
          <p className="text-white/80 text-sm mt-1">{skill.description}</p>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm font-semibold text-stone-600 mb-2">課程影片（{skill.videoCount} 集）</p>
          {Array.from({ length: skill.videoCount }, (_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                {i < 1 && skill.unlocked ? (
                  <Play className="w-5 h-5 text-amber-600" />
                ) : (
                  <Lock className="w-4 h-4 text-stone-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-800">第 {i + 1} 課：{['介紹與準備', '工具使用', '標準流程', '常見問題', '進階技巧', '品質檢查'][i] || '補充教材'}</p>
                <p className="text-xs text-stone-400">{Math.floor(Math.random() * 5) + 3} 分鐘</p>
              </div>
              {i < 1 && skill.unlocked && <ChevronRight className="w-4 h-4 text-stone-300" />}
            </div>
          ))}

          {/* 測驗按鈕 */}
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-800">線上測驗</span>
            </div>
            <p className="text-xs text-amber-600 mb-3">完成所有影片後解鎖測驗，通過即可接取此類任務</p>
            <button
              disabled={!skill.unlocked}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                skill.unlocked
                  ? 'bg-amber-500 text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
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
    <div className="flex-1 overflow-y-auto bg-stone-50">
      {/* 頂部 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-5 h-5" />
          <span className="font-bold text-lg">技能認證</span>
        </div>
        <p className="text-white/80 text-sm">觀看教學影片 → 通過測驗 → 解鎖對應任務</p>
      </div>

      {/* 解鎖統計 */}
      <div className="mx-4 mt-4 p-4 bg-white rounded-2xl shadow-sm border border-stone-100">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-amber-600">{SKILLS.filter(s => s.unlocked).length}</p>
            <p className="text-xs text-stone-400">已解鎖</p>
          </div>
          <div className="w-px h-10 bg-stone-100" />
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-stone-400">{SKILLS.filter(s => !s.unlocked).length}</p>
            <p className="text-xs text-stone-400">待解鎖</p>
          </div>
          <div className="w-px h-10 bg-stone-100" />
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-green-600">{SKILLS.filter(s => s.quizPassed).length}</p>
            <p className="text-xs text-stone-400">已認證</p>
          </div>
        </div>
      </div>

      {/* 技能列表 */}
      <div className="p-4 space-y-3">
        {SKILLS.map(skill => (
          <button
            key={skill.id}
            onClick={() => setActiveSkill(skill.id)}
            className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 ${skill.borderColor}`}
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${skill.color} flex items-center justify-center text-2xl flex-shrink-0`}>
              {skill.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-stone-800 text-sm">{skill.name}</p>
                {skill.quizPassed && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
              </div>
              <p className="text-xs text-stone-400 truncate">{skill.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${skill.unlocked ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                  {skill.unlocked ? '🔓 已解鎖' : '🔒 未解鎖'}
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