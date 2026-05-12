import React, { useState, useRef, useCallback } from 'react';
import {
  Home, Trash2, Shirt, UtensilsCrossed, Sparkles, PawPrint, Package,
  Wind, Building, HardHat, RefreshCw,
  CheckCircle2, Lock, Award, ChevronRight, ClipboardCheck, Play, X, ZoomIn, ZoomOut
} from 'lucide-react';

// ─────────────────────────────────────────────
// Skill-tree data
// ─────────────────────────────────────────────
const TREE_DATA = {
  家事: {
    icon: Home, color: '#111', x: 260, y: 40,
    children: [
      {
        id: 'clean', name: '清潔', icon: Sparkles, x: 80, y: 170,
        unlocked: true, quizPassed: true, videoCount: 3, taskType: '日常清潔',
        description: '標準居家清潔流程與常用清潔劑使用',
        children: [
          { id: 'deep_clean', name: '深層細清', icon: Wind, x: 0, y: 310, unlocked: false, quizPassed: false, videoCount: 5, taskType: '細清案件', description: '深層除垢除黴，精細清潔手法' },
          { id: 'const_clean', name: '裝潢後清', icon: HardHat, x: 120, y: 310, unlocked: false, quizPassed: false, videoCount: 6, taskType: '毛坯案件', description: '建材粉塵、油漆殘留專業處理' },
        ],
      },
      {
        id: 'trash', name: '清運', icon: Trash2, x: 220, y: 170,
        unlocked: true, quizPassed: false, videoCount: 2, taskType: '清運案件',
        description: '垃圾分類、廢棄物清運作業規範',
        children: [],
      },
      {
        id: 'laundry', name: '衣物', icon: Shirt, x: 360, y: 170,
        unlocked: false, quizPassed: false, videoCount: 3, taskType: '衣物案件',
        description: '衣物整燙、手洗、送洗流程',
        children: [],
      },
      {
        id: 'dishes', name: '洗碗', icon: UtensilsCrossed, x: 480, y: 170,
        unlocked: false, quizPassed: false, videoCount: 2, taskType: '廚房案件',
        description: '廚房器具清洗與消毒標準',
        children: [],
      },
      {
        id: 'pets', name: '寵物', icon: PawPrint, x: 370, y: 310,
        unlocked: false, quizPassed: false, videoCount: 3, taskType: '寵物家庭',
        description: '毛髮清除、寵物友善清潔劑使用',
        children: [],
      },
      {
        id: 'storage', name: '收納', icon: Package, x: 490, y: 310,
        unlocked: false, quizPassed: false, videoCount: 4, taskType: '收納案件',
        description: '空間規劃、物品分類與收納技巧',
        children: [],
      },
      {
        id: 'rental', name: '民宿旅宿', icon: Building, x: 600, y: 170,
        unlocked: false, quizPassed: false, videoCount: 4, taskType: '民宿清潔',
        description: '快速換房與品質控制標準',
        children: [],
      },
      {
        id: 'recurring', name: '定期清潔', icon: RefreshCw, x: 600, y: 310,
        unlocked: false, quizPassed: false, videoCount: 3, taskType: '定清案件',
        description: '定期服務流程與客戶關係維護',
        children: [],
      },
    ],
  },
};

// flatten all nodes
function flattenNodes(treeData) {
  const nodes = [];
  const edges = [];
  Object.entries(treeData).forEach(([rootName, rootData]) => {
    const rootId = `root_${rootName}`;
    nodes.push({ id: rootId, name: rootName, icon: rootData.icon, x: rootData.x, y: rootData.y, isRoot: true, unlocked: true, quizPassed: false });
    rootData.children.forEach(child => {
      edges.push({ from: rootId, to: child.id });
      nodes.push({ ...child });
      child.children?.forEach(gc => {
        edges.push({ from: child.id, to: gc.id });
        nodes.push({ ...gc });
      });
    });
  });
  return { nodes, edges };
}

const { nodes: NODES, edges: EDGES } = flattenNodes(TREE_DATA);

// ─────────────────────────────────────────────
// Node circle component
// ─────────────────────────────────────────────
function SkillNode({ node, onPress }) {
  const Icon = node.icon;
  const size = node.isRoot ? 52 : 46;
  const isLocked = !node.isRoot && !node.unlocked;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: 'pointer' }}
      onClick={() => !node.isRoot && onPress(node)}
    >
      {/* outer ring */}
      <circle r={size / 2 + 5} fill={node.quizPassed ? '#111' : isLocked ? '#e5e5e5' : '#fff'} stroke={node.quizPassed ? '#111' : '#ccc'} strokeWidth={1.5} />
      {/* inner fill */}
      <circle r={size / 2} fill={node.quizPassed ? '#111' : isLocked ? '#f5f5f5' : '#fff'} />
      {/* icon */}
      <foreignObject x={-12} y={-12} width={24} height={24}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Icon style={{ width: 16, height: 16, color: node.quizPassed ? '#fff' : isLocked ? '#ccc' : '#111', flexShrink: 0 }} />
        </div>
      </foreignObject>
      {/* lock badge */}
      {isLocked && (
        <>
          <circle cx={size / 2 - 2} cy={-(size / 2 - 2)} r={8} fill="#111" />
          <foreignObject x={size / 2 - 10} y={-(size / 2 + 6)} width={16} height={16}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <Lock style={{ width: 9, height: 9, color: '#fff', flexShrink: 0 }} />
            </div>
          </foreignObject>
        </>
      )}
      {/* label */}
      <text y={size / 2 + 18} textAnchor="middle" fontSize={11} fontWeight={600} fill={isLocked ? '#aaa' : '#111'}>
        {node.name}
      </text>
      {/* branch count badge */}
      {!node.isRoot && (() => {
        // find children of this node in edges
        const childEdges = EDGES.filter(e => e.from === node.id);
        if (childEdges.length === 0) return null;
        const childNodes = childEdges.map(e => NODES.find(n => n.id === e.to)).filter(Boolean);
        const unlockedCount = childNodes.filter(n => n.unlocked).length;
        return (
          <text y={size / 2 + 30} textAnchor="middle" fontSize={9} fill="#999">
            {unlockedCount}/{childNodes.length} 解鎖
          </text>
        );
      })()}
    </g>
  );
}

// ─────────────────────────────────────────────
// Detail drawer
// ─────────────────────────────────────────────
function SkillDetail({ node, onClose }) {
  const Icon = node.icon;
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white">
      <div className="bg-black p-5 text-white flex-shrink-0">
        <button onClick={onClose} className="text-white/50 text-sm mb-4 flex items-center gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> 返回技能樹
        </button>
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold">{node.name}</h2>
        <p className="text-white/50 text-sm mt-1">{node.description}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">課程影片（{node.videoCount} 集）</p>
        {Array.from({ length: node.videoCount }, (_, i) => (
          <div key={i} className="bg-stone-50 rounded-xl p-4 flex items-center gap-3 border border-stone-100">
            <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center flex-shrink-0">
              {i < 1 && node.unlocked ? <Play className="w-4 h-4 text-black" /> : <Lock className="w-3.5 h-3.5 text-stone-300" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-800">第 {i + 1} 課：{['介紹與準備', '工具使用', '標準流程', '常見問題', '進階技巧', '品質檢查'][i] || '補充教材'}</p>
              <p className="text-xs text-stone-400">{[5,8,6,7,9,5][i] || 5} 分鐘</p>
            </div>
            {i < 1 && node.unlocked && <ChevronRight className="w-4 h-4 text-stone-300" />}
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
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${node.unlocked ? 'bg-black text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
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

// ─────────────────────────────────────────────
// Main SkillsTab
// ─────────────────────────────────────────────
export default function SkillsTab() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [offset, setOffset] = useState({ x: 20, y: 40 });
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const SVG_W = 720;
  const SVG_H = 420;

  const onPointerDown = useCallback((e) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    svgRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
  }, []);

  const onPointerUp = useCallback(() => { isDragging.current = false; }, []);

  const unlockedCount = NODES.filter(n => !n.isRoot && n.unlocked).length;
  const certCount = NODES.filter(n => n.quizPassed).length;
  const totalCount = NODES.filter(n => !n.isRoot).length;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
      {/* Header */}
      <div className="bg-black px-5 pt-6 pb-4 text-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <span className="font-bold text-lg">技能樹</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span>已解鎖 <span className="text-white font-bold">{unlockedCount}</span>/{totalCount}</span>
            <span>已認證 <span className="text-white font-bold">{certCount}</span></span>
          </div>
        </div>
        <p className="text-white/40 text-xs mt-1">拖移畫布探索 · 點擊節點查看課程</p>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-20 right-3 z-20 flex flex-col gap-1">
        <button onClick={() => setScale(s => Math.min(s + 0.2, 2))} className="w-8 h-8 bg-white border border-stone-200 rounded-lg flex items-center justify-center shadow-sm">
          <ZoomIn className="w-4 h-4 text-stone-600" />
        </button>
        <button onClick={() => setScale(s => Math.max(s - 0.2, 0.4))} className="w-8 h-8 bg-white border border-stone-200 rounded-lg flex items-center justify-center shadow-sm">
          <ZoomOut className="w-4 h-4 text-stone-600" />
        </button>
        <button onClick={() => { setOffset({ x: 20, y: 40 }); setScale(1); }} className="w-8 h-8 bg-white border border-stone-200 rounded-lg flex items-center justify-center shadow-sm text-xs text-stone-500 font-bold">
          ↺
        </button>
      </div>

      {/* SVG canvas */}
      <div className="flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
            {/* Edges */}
            {EDGES.map((edge, i) => {
              const from = NODES.find(n => n.id === edge.from);
              const to = NODES.find(n => n.id === edge.to);
              if (!from || !to) return null;
              const midY = (from.y + to.y) / 2;
              return (
                <path
                  key={i}
                  d={`M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`}
                  fill="none"
                  stroke={to.unlocked ? '#111' : '#ddd'}
                  strokeWidth={to.unlocked ? 2 : 1.5}
                  strokeDasharray={to.unlocked ? '' : '5,4'}
                />
              );
            })}
            {/* Nodes */}
            {NODES.map(node => (
              <SkillNode key={node.id} node={node} onPress={setSelectedNode} />
            ))}
          </g>
        </svg>
      </div>

      {/* Detail overlay */}
      {selectedNode && (
        <SkillDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}