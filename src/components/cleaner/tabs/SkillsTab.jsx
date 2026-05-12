import React, { useState } from 'react';
import {
  Lock, CheckCircle2, ChevronRight, Award,
  Trash2, Shirt, UtensilsCrossed, Sparkles, PawPrint, Package,
  Bed, Wind, Star, ClipboardCheck, Play, ArrowLeft
} from 'lucide-react';

// ─── 技能樹資料 ───────────────────────────────────────────────
const TREES = {
  home: {
    label: '家事清潔',
    nodes: [
      {
        id: 'clean_basic',
        name: '基礎清潔',
        Icon: Sparkles,
        unlocked: true,
        quizPassed: true,
        taskType: '輕量案件',
        videoCount: 3,
        description: '掌握標準清潔流程與基本工具使用',
        branches: [
          {
            id: 'garbage',
            name: '清運垃圾',
            Icon: Trash2,
            unlocked: true,
            quizPassed: true,
            taskType: '清運任務',
            videoCount: 2,
            description: '垃圾分類、清袋、廚餘處理標準流程',
            branches: [],
          },
          {
            id: 'laundry',
            name: '衣物洗滌',
            Icon: Shirt,
            unlocked: true,
            quizPassed: false,
            taskType: '洗衣任務',
            videoCount: 3,
            description: '衣物分類、洗衣機設定、晾曬折疊規範',
            branches: [],
          },
          {
            id: 'dishes',
            name: '洗碗洗杯',
            Icon: UtensilsCrossed,
            unlocked: false,
            quizPassed: false,
            taskType: '清潔任務',
            videoCount: 2,
            description: '餐具清洗、消毒、收納標準操作',
            branches: [],
          },
        ],
      },
      {
        id: 'deep_clean',
        name: '深層細清',
        Icon: Wind,
        unlocked: false,
        quizPassed: false,
        taskType: '細清案件',
        videoCount: 5,
        description: '除垢除黴、縫隙清潔等進階手法',
        branches: [
          {
            id: 'pet_clean',
            name: '寵物清潔',
            Icon: PawPrint,
            unlocked: false,
            quizPassed: false,
            taskType: '寵物任務',
            videoCount: 3,
            description: '毛髮清除、除臭消毒、安撫寵物技巧',
            branches: [],
          },
          {
            id: 'storage',
            name: '收納整理',
            Icon: Package,
            unlocked: false,
            quizPassed: false,
            taskType: '收納任務',
            videoCount: 3,
            description: '空間規劃、物品分類與系統化收納',
            branches: [],
          },
        ],
      },
      {
        id: 'recurring',
        name: '定期服務',
        Icon: Star,
        unlocked: true,
        quizPassed: true,
        taskType: '定清案件',
        videoCount: 3,
        description: '客戶關係維護與定期服務標準流程',
        branches: [],
      },
    ],
  },
  bnb: {
    label: '民宿旅宿',
    nodes: [
      {
        id: 'bnb_basic',
        name: '換房基礎',
        Icon: Bed,
        unlocked: true,
        quizPassed: true,
        taskType: '民宿換房',
        videoCount: 4,
        description: '快速換房流程、備品補充與品質控制',
        branches: [
          {
            id: 'bnb_laundry',
            name: '床單換洗',
            Icon: Shirt,
            unlocked: true,
            quizPassed: false,
            taskType: '換洗任務',
            videoCount: 2,
            description: '床單更換、摺疊技巧與枕套標準',
            branches: [],
          },
          {
            id: 'bnb_storage',
            name: '備品收納',
            Icon: Package,
            unlocked: false,
            quizPassed: false,
            taskType: '收納任務',
            videoCount: 2,
            description: '備品清點、補充與整齊擺放',
            branches: [],
          },
        ],
      },
      {
        id: 'bnb_deep',
        name: '深度翻房',
        Icon: Sparkles,
        unlocked: false,
        quizPassed: false,
        taskType: '細清案件',
        videoCount: 5,
        description: '衛浴細清、廚房油汙與客房深度整理',
        branches: [
          {
            id: 'bnb_pet',
            name: '寵物友善房',
            Icon: PawPrint,
            unlocked: false,
            quizPassed: false,
            taskType: '寵物任務',
            videoCount: 3,
            description: '毛髮徹底清除與除臭處理',
            branches: [],
          },
        ],
      },
    ],
  },
};

// ─── 工具：扁平化所有節點 ────────────────────────────────────
function flattenNodes(nodes) {
  const result = [];
  function walk(n) { result.push(n); n.branches?.forEach(walk); }
  nodes.forEach(walk);
  return result;
}

// ─── 技能詳情頁 ───────────────────────────────────────────────
function SkillDetail({ node, onBack }) {
  return (
    <div className="flex-1 overflow-y-auto bg-white h-full">
      <div className="bg-black p-6 text-white">
        <button onClick={onBack} className="flex items-center gap-1 text-white/50 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> 返回技能樹
        </button>
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
          <node.Icon className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold">{node.name}</h2>
        <p className="text-white/50 text-sm mt-1">{node.description}</p>
        <span className="inline-block mt-2 text-xs border border-white/20 px-2 py-0.5 rounded-full text-white/60">
          解鎖任務：{node.taskType}
        </span>
      </div>

      <div className="p-4 space-y-2">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          課程影片（{node.videoCount} 集）
        </p>
        {Array.from({ length: node.videoCount }, (_, i) => (
          <div key={i} className="bg-stone-50 rounded-xl p-4 flex items-center gap-3 border border-stone-100">
            <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center flex-shrink-0">
              {i === 0 && node.unlocked
                ? <Play className="w-4 h-4 text-black" />
                : <Lock className="w-3.5 h-3.5 text-stone-300" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-800">
                第 {i + 1} 課：{['介紹與準備', '工具使用', '標準流程', '常見問題', '進階技巧', '品質檢查'][i] || '補充教材'}
              </p>
              <p className="text-xs text-stone-400">{[5, 8, 6, 7, 9, 5][i] || 5} 分鐘</p>
            </div>
            {i === 0 && node.unlocked && <ChevronRight className="w-4 h-4 text-stone-300" />}
          </div>
        ))}

        <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-4 h-4 text-stone-700" />
            <span className="font-semibold text-stone-800 text-sm">線上測驗</span>
          </div>
          <p className="text-xs text-stone-400 mb-3">完成所有影片後解鎖測驗，通過即可接取此類任務</p>
          <button
            disabled={!node.unlocked}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              node.unlocked ? 'bg-black text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {node.quizPassed
                ? <><CheckCircle2 className="w-4 h-4" /> 已通過測驗</>
                : node.unlocked
                  ? '開始測驗'
                  : <><Lock className="w-4 h-4" /> 請先完成影片</>}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 節點卡片 ────────────────────────────────────────────────
function NodeCard({ node, depth = 0, onClick }) {
  const unlockedBranches = node.branches?.filter(b => b.unlocked).length ?? 0;
  const totalBranches = node.branches?.length ?? 0;

  return (
    <div className={`flex flex-col items-center ${depth > 0 ? 'mt-1' : ''}`}>
      {/* 連接線 */}
      {depth > 0 && <div className="w-px h-5 bg-stone-200" />}

      <button
        onClick={() => onClick(node)}
        className={`relative group w-full max-w-xs rounded-2xl border p-4 text-left transition-all active:scale-95 shadow-sm
          ${node.unlocked
            ? 'bg-white border-stone-200 hover:border-stone-400'
            : 'bg-stone-50 border-stone-100 opacity-70'}
        `}
      >
        {/* 狀態標記 */}
        <div className="absolute top-3 right-3">
          {node.quizPassed
            ? <CheckCircle2 className="w-4 h-4 text-black" />
            : node.unlocked
              ? <div className="w-4 h-4 rounded-full border-2 border-stone-300" />
              : <Lock className="w-4 h-4 text-stone-300" />}
        </div>

        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${node.unlocked ? 'bg-black' : 'bg-stone-200'}`}>
            <node.Icon className={`w-5 h-5 ${node.unlocked ? 'text-white' : 'text-stone-400'}`} />
          </div>
          <div className="flex-1 min-w-0 pr-5">
            <p className="font-semibold text-stone-800 text-sm leading-tight">{node.name}</p>
            <p className="text-xs text-stone-400 truncate mt-0.5">{node.taskType}</p>
            {totalBranches > 0 && (
              <p className="text-xs text-stone-500 mt-1 font-medium">
                分支解鎖 {unlockedBranches}/{totalBranches}
              </p>
            )}
          </div>
        </div>
      </button>

      {/* 分支 */}
      {node.branches && node.branches.length > 0 && (
        <div className="w-full max-w-xs mt-1 flex flex-col items-center gap-0">
          {/* 分叉橫線 */}
          {node.branches.length > 1 && (
            <div className="w-full flex flex-col items-center">
              <div className="w-px h-4 bg-stone-200" />
              <div
                className="h-px bg-stone-200"
                style={{ width: `${Math.min(node.branches.length * 60, 220)}px` }}
              />
            </div>
          )}
          <div className="flex gap-3 items-start justify-center flex-wrap">
            {node.branches.map((branch) => (
              <div key={branch.id} className="flex flex-col items-center" style={{ width: '140px' }}>
                <NodeCard node={branch} depth={1} onClick={onClick} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 主元件 ───────────────────────────────────────────────────
export default function SkillsTab() {
  const [treeKey, setTreeKey] = useState('home');
  const [activeNode, setActiveNode] = useState(null);

  const tree = TREES[treeKey];
  const allNodes = flattenNodes(tree.nodes);
  const unlockedCount = allNodes.filter(n => n.unlocked).length;
  const certCount = allNodes.filter(n => n.quizPassed).length;

  if (activeNode) {
    return <SkillDetail node={activeNode} onBack={() => setActiveNode(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white h-full">
      {/* 頂部標頭 */}
      <div className="bg-black px-5 pt-8 pb-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-5 h-5" />
          <span className="font-bold text-lg tracking-wide">技能樹</span>
        </div>
        <p className="text-white/50 text-xs">解鎖節點 → 完成測驗 → 接取對應任務</p>

        {/* 切換：家事 / 民宿 */}
        <div className="flex gap-2 mt-4">
          {Object.entries(TREES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setTreeKey(key)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                treeKey === key
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 統計列 */}
      <div className="mx-4 mt-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
        <div className="flex items-center justify-between">
          {[
            { label: '已解鎖', value: unlockedCount },
            { label: '待解鎖', value: allNodes.length - unlockedCount },
            { label: '已認證', value: certCount },
          ].map(({ label, value }, i, arr) => (
            <React.Fragment key={label}>
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-stone-800">{value}</p>
                <p className="text-xs text-stone-400">{label}</p>
              </div>
              {i < arr.length - 1 && <div className="w-px h-8 bg-stone-200" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 技能樹 */}
      <div className="px-4 pt-5 pb-24 flex flex-col items-center gap-2">
        {tree.nodes.map((node, i) => (
          <React.Fragment key={node.id}>
            {i > 0 && <div className="w-px h-4 bg-stone-200" />}
            <NodeCard node={node} depth={0} onClick={setActiveNode} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}