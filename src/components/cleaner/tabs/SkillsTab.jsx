import React, { useState } from 'react';
import {
  Lock, CheckCircle2, Award, ArrowLeft,
  Trash2, Shirt, UtensilsCrossed, Sparkles, PawPrint, Package,
  Bed, Wind, Star, ClipboardCheck, Play, ChevronRight, Zap
} from 'lucide-react';

// ─── 共享技能節點（跨母項目同步）────────────────────────────
// key 是共享節點 ID，值是解鎖狀態（全域共享）
const SHARED_SKILL_IDS = ['garbage', 'laundry', 'dishes', 'pet_clean', 'storage'];

// ─── 技能定義（共享節點只定義一次）──────────────────────────
const SKILL_DEFS = {
  garbage:   { id: 'garbage',   name: '清運垃圾', Icon: Trash2,          taskType: '清運任務', videoCount: 2, description: '垃圾分類、清袋、廚餘處理標準流程', shared: true },
  laundry:   { id: 'laundry',   name: '衣物洗滌', Icon: Shirt,           taskType: '洗衣任務', videoCount: 3, description: '衣物分類、洗衣機設定、晾曬折疊規範', shared: true },
  dishes:    { id: 'dishes',    name: '洗碗洗杯', Icon: UtensilsCrossed, taskType: '清潔任務', videoCount: 2, description: '餐具清洗、消毒、收納標準操作', shared: true },
  pet_clean: { id: 'pet_clean', name: '寵物清潔', Icon: PawPrint,        taskType: '寵物任務', videoCount: 3, description: '毛髮清除、除臭消毒、安撫寵物技巧', shared: true },
  storage:   { id: 'storage',   name: '收納整理', Icon: Package,         taskType: '收納任務', videoCount: 3, description: '空間規劃、物品分類與系統化收納', shared: true },
  // 非共享
  clean_basic:  { id: 'clean_basic',  name: '基礎清潔',   Icon: Sparkles,        taskType: '輕量案件', videoCount: 3, description: '掌握標準清潔流程與基本工具使用' },
  deep_clean:   { id: 'deep_clean',   name: '深層細清',   Icon: Wind,            taskType: '細清案件', videoCount: 5, description: '除垢除黴、縫隙清潔等進階手法' },
  recurring:    { id: 'recurring',    name: '定期服務',   Icon: Star,            taskType: '定清案件', videoCount: 3, description: '客戶關係維護與定期服務標準流程' },
  bnb_basic:    { id: 'bnb_basic',    name: '換房基礎',   Icon: Bed,             taskType: '民宿換房', videoCount: 4, description: '快速換房流程、備品補充與品質控制' },
  bnb_deep:     { id: 'bnb_deep',     name: '深度翻房',   Icon: Sparkles,        taskType: '細清案件', videoCount: 5, description: '衛浴細清、廚房油汙與客房深度整理' },
  construction: { id: 'construction', name: '裝潢後清潔', Icon: Zap,             taskType: '毛坯案件', videoCount: 6, description: '建材粉塵、油漆殘留專業處理' },
};

// ─── 母項目技能樹結構 ────────────────────────────────────────
// 每個 row 是同一層的節點，節點引用 SKILL_DEFS 的 id
const CATEGORIES = [
  {
    key: 'recurring',
    label: '定期清潔',
    color: '#1a1a1a',
    rows: [
      [{ id: 'clean_basic', prereq: [] }],
      [{ id: 'garbage', prereq: ['clean_basic'] }, { id: 'laundry', prereq: ['clean_basic'] }, { id: 'dishes', prereq: ['clean_basic'] }],
      [{ id: 'recurring', prereq: ['garbage', 'laundry'] }],
    ],
  },
  {
    key: 'fine',
    label: '居家細清',
    color: '#1a1a1a',
    rows: [
      [{ id: 'deep_clean', prereq: [] }],
      [{ id: 'pet_clean', prereq: ['deep_clean'] }, { id: 'storage', prereq: ['deep_clean'] }, { id: 'dishes', prereq: ['deep_clean'] }],
      [{ id: 'clean_basic', prereq: ['pet_clean', 'storage'] }],
    ],
  },
  {
    key: 'bnb',
    label: '民宿房務',
    color: '#1a1a1a',
    rows: [
      [{ id: 'bnb_basic', prereq: [] }],
      [{ id: 'laundry', prereq: ['bnb_basic'] }, { id: 'storage', prereq: ['bnb_basic'] }, { id: 'pet_clean', prereq: ['bnb_basic'] }],
      [{ id: 'bnb_deep', prereq: ['laundry', 'storage'] }],
    ],
  },
];

// ─── 初始解鎖狀態 ────────────────────────────────────────────
const INITIAL_STATE = {
  clean_basic:  { unlocked: true,  quizPassed: true },
  recurring:    { unlocked: true,  quizPassed: true },
  deep_clean:   { unlocked: false, quizPassed: false },
  bnb_basic:    { unlocked: true,  quizPassed: false },
  bnb_deep:     { unlocked: false, quizPassed: false },
  construction: { unlocked: false, quizPassed: false },
  garbage:      { unlocked: true,  quizPassed: true },
  laundry:      { unlocked: true,  quizPassed: false },
  dishes:       { unlocked: false, quizPassed: false },
  pet_clean:    { unlocked: false, quizPassed: false },
  storage:      { unlocked: false, quizPassed: false },
};

// ─── 技能詳情面板 ────────────────────────────────────────────
function SkillPanel({ skillId, skillState, onClose }) {
  const def = SKILL_DEFS[skillId];
  const { unlocked, quizPassed } = skillState;
  if (!def) return null;
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white animate-in slide-in-from-right duration-200">
      <div className="bg-black px-5 pt-8 pb-5 text-white flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-1 text-white/50 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> 返回技能樹
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <def.Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{def.name}</h2>
              {def.shared && (
                <span className="text-xs bg-white/20 text-white/80 px-2 py-0.5 rounded-full">共享技能</span>
              )}
            </div>
            <p className="text-white/50 text-xs mt-0.5">{def.description}</p>
            <span className="inline-block mt-1.5 text-xs border border-white/20 px-2 py-0.5 rounded-full text-white/60">
              解鎖任務：{def.taskType}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          課程影片（{def.videoCount} 集）
        </p>
        {Array.from({ length: def.videoCount }, (_, i) => (
          <div key={i} className="bg-stone-50 rounded-xl p-4 flex items-center gap-3 border border-stone-100">
            <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center flex-shrink-0">
              {i === 0 && unlocked
                ? <Play className="w-4 h-4 text-black" />
                : <Lock className="w-3.5 h-3.5 text-stone-300" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-800">
                第 {i + 1} 課：{['介紹與準備', '工具使用', '標準流程', '常見問題', '進階技巧', '品質檢查'][i] || '補充教材'}
              </p>
              <p className="text-xs text-stone-400">{[5, 8, 6, 7, 9, 5][i] || 5} 分鐘</p>
            </div>
            {i === 0 && unlocked && <ChevronRight className="w-4 h-4 text-stone-300" />}
          </div>
        ))}

        <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-4 h-4 text-stone-700" />
            <span className="font-semibold text-stone-800 text-sm">線上測驗</span>
          </div>
          <p className="text-xs text-stone-400 mb-3">完成所有影片後解鎖測驗，通過即可接取此類任務</p>
          <button
            disabled={!unlocked}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              unlocked ? 'bg-black text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {quizPassed
                ? <><CheckCircle2 className="w-4 h-4" /> 已通過測驗</>
                : unlocked
                  ? '開始測驗'
                  : <><Lock className="w-4 h-4" /> 請先完成影片</>}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 六邊形節點 ──────────────────────────────────────────────
function HexNode({ skillId, skillState, onClick, isShared }) {
  const def = SKILL_DEFS[skillId];
  if (!def) return null;
  const { unlocked, quizPassed } = skillState;

  return (
    <button
      onClick={() => onClick(skillId)}
      className="flex flex-col items-center gap-1.5 group"
    >
      {/* 六邊形容器 */}
      <div className="relative">
        {/* SVG 六邊形背景 */}
        <svg width="64" height="72" viewBox="0 0 64 72" className="drop-shadow-md">
          <polygon
            points="32,2 62,18 62,54 32,70 2,54 2,18"
            fill={quizPassed ? '#000000' : unlocked ? '#292929' : '#d1ccc4'}
            stroke={isShared ? '#888' : quizPassed ? '#555' : unlocked ? '#444' : '#c5bfb5'}
            strokeWidth="2"
          />
          {/* 已通過光暈 */}
          {quizPassed && (
            <polygon
              points="32,2 62,18 62,54 32,70 2,54 2,18"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              opacity="0.3"
            />
          )}
        </svg>
        {/* 圖示 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <def.Icon
            className={`w-6 h-6 ${quizPassed ? 'text-white' : unlocked ? 'text-stone-300' : 'text-stone-500'}`}
            strokeWidth={1.8}
          />
        </div>
        {/* 完成標記 */}
        {quizPassed && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-stone-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-black" />
          </div>
        )}
        {/* 未解鎖鎖頭 */}
        {!unlocked && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-stone-200 rounded-full flex items-center justify-center">
            <Lock className="w-3 h-3 text-stone-500" />
          </div>
        )}
        {/* 共享標記 */}
        {isShared && unlocked && !quizPassed && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-stone-700 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        )}
      </div>
      {/* 名稱 */}
      <span className={`text-xs font-semibold leading-tight text-center max-w-[68px] ${
        unlocked ? 'text-stone-800' : 'text-stone-400'
      }`}>
        {def.name}
      </span>
    </button>
  );
}

// ─── 連接線 ──────────────────────────────────────────────────
function Connector() {
  return (
    <div className="flex justify-center py-1">
      <div className="w-px h-6 bg-stone-300 border-dashed" style={{ borderLeft: '2px dashed #c5bfb5' }} />
    </div>
  );
}

// ─── 主元件 ──────────────────────────────────────────────────
export default function SkillsTab() {
  const [catKey, setCatKey] = useState('recurring');
  const [skillStates, setSkillStates] = useState(INITIAL_STATE);
  const [activeSkill, setActiveSkill] = useState(null);

  const category = CATEGORIES.find(c => c.key === catKey);

  // 統計（所有技能去重）
  const allIds = Object.keys(SKILL_DEFS);
  const unlockedCount = allIds.filter(id => skillStates[id]?.unlocked).length;
  const certCount = allIds.filter(id => skillStates[id]?.quizPassed).length;

  // 當前分類完成度
  const catAllIds = [...new Set(category.rows.flat().map(n => n.id))];
  const catDone = catAllIds.filter(id => skillStates[id]?.quizPassed).length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f3f0] h-full relative">
      {/* 頂部 */}
      <div className="bg-black px-5 pt-8 pb-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <span className="font-bold text-lg tracking-wide">技能樹</span>
          </div>
          <div className="flex gap-3 text-xs text-white/50">
            <span>已認證 <span className="text-white font-bold">{certCount}</span></span>
            <span>已解鎖 <span className="text-white font-bold">{unlockedCount}</span></span>
          </div>
        </div>

        {/* 母項目切換 */}
        <div className="flex gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCatKey(c.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                catKey === c.key
                  ? 'bg-white text-black shadow'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* 進度條 */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span>進度</span>
            <span>{catDone}/{catAllIds.length}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${catAllIds.length ? (catDone / catAllIds.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 技能樹主體 */}
      <div className="px-4 pt-6 pb-28 flex flex-col items-center">
        {category.rows.map((row, rowIdx) => (
          <React.Fragment key={rowIdx}>
            {rowIdx > 0 && <Connector />}
            <div className="flex gap-5 items-start justify-center flex-wrap">
              {row.map(({ id }) => (
                <HexNode
                  key={id}
                  skillId={id}
                  skillState={skillStates[id] || { unlocked: false, quizPassed: false }}
                  onClick={setActiveSkill}
                  isShared={SHARED_SKILL_IDS.includes(id)}
                />
              ))}
            </div>
          </React.Fragment>
        ))}

        {/* 共享技能說明 */}
        <div className="mt-8 w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-stone-500 mb-2">共享技能說明</p>
          <p className="text-xs text-stone-400 leading-relaxed">
            帶有 <span className="inline-flex items-center gap-0.5 align-middle"><span className="w-3 h-3 bg-stone-700 rounded-full inline-block" /></span> 標記的技能為共享節點——在任一母項目中解鎖後，其他項目中的同一技能將自動同步，不需重複學習。
          </p>
        </div>
      </div>

      {/* 技能詳情面板 */}
      {activeSkill && (
        <SkillPanel
          skillId={activeSkill}
          skillState={skillStates[activeSkill] || { unlocked: false, quizPassed: false }}
          onClose={() => setActiveSkill(null)}
        />
      )}
    </div>
  );
}