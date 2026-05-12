import React, { useState, useRef, useCallback } from 'react';
import {
  Home, Trash2, Shirt, UtensilsCrossed, Sparkles, PawPrint, Package,
  Wind, Building, HardHat, RefreshCw,
  CheckCircle2, Lock, Award, ChevronRight, ClipboardCheck, Play, ZoomIn, ZoomOut
} from 'lucide-react';

// ─────────────────────────────────────────────
// Layout: horizontal tree (x = depth, y = slot)
// Column X positions
const COL = { root: 60, L1: 220, L2: 400 };
// Row Y spacing
const ROW_H = 90;

// Template for a skill node
const node = (id, name, icon, col, row, { unlocked = false, quizPassed = false, videoCount = 3, taskType = '', description = '', children = [] } = {}) => ({
  id, name, icon, x: COL[col], y: 40 + row * ROW_H,
  unlocked, quizPassed, videoCount, taskType, description, children,
});

// Build tree: root → L1 children → L2 grandchildren
const ROOT = {
  id: 'root_家事', name: '家事', icon: Home,
  x: COL.root, y: 40 + 3.5 * ROW_H, // vertically centred
  isRoot: true, unlocked: true, quizPassed: false,
  children: [
    node('clean',     '清潔',    Sparkles,        'L1', 0, { unlocked: true,  quizPassed: true,  videoCount: 3, taskType: '日常清潔', description: '標準居家清潔流程與常用清潔劑使用', children: [
      node('deep_clean',  '深層細清', Wind,   'L2', 0, { videoCount: 5, taskType: '細清案件', description: '深層除垢除黴，精細清潔手法' }),
      node('const_clean', '裝潢後清', HardHat,'L2', 1, { videoCount: 6, taskType: '毛坯案件', description: '建材粉塵、油漆殘留專業處理' }),
    ]}),
    node('trash',     '清運',    Trash2,          'L1', 1, { unlocked: true,  videoCount: 2, taskType: '清運案件', description: '垃圾分類、廢棄物清運作業規範' }),
    node('laundry',   '衣物',    Shirt,           'L1', 2, { videoCount: 3, taskType: '衣物案件', description: '衣物整燙、手洗、送洗流程' }),
    node('dishes',    '洗碗',    UtensilsCrossed, 'L1', 3, { videoCount: 2, taskType: '廚房案件', description: '廚房器具清洗與消毒標準', children: [
      node('pets',    '寵物',    PawPrint, 'L2', 3, { videoCount: 3, taskType: '寵物家庭', description: '毛髮清除、寵物友善清潔劑使用' }),
    ]}),
    node('storage',   '收納',    Package,         'L1', 4, { videoCount: 4, taskType: '收納案件', description: '空間規劃、物品分類與收納技巧' }),
    node('rental',    '民宿旅宿', Building,       'L1', 5, { videoCount: 4, taskType: '民宿清潔', description: '快速換房與品質控制標準' }),
    node('recurring', '定期清潔', RefreshCw,      'L1', 6, { videoCount: 3, taskType: '定清案件', description: '定期服務流程與客戶關係維護' }),
  ],
};

// Flatten nodes and edges
function flatten(root) {
  const nodes = [root];
  const edges = [];
  root.children?.forEach(c => {
    edges.push({ from: root.id, to: c.id, unlocked: c.unlocked });
    nodes.push(c);
    c.children?.forEach(gc => {
      edges.push({ from: c.id, to: gc.id, unlocked: gc.unlocked });
      nodes.push(gc);
    });
  });
  return { nodes, edges };
}

const { nodes: NODES, edges: EDGES } = flatten(ROOT);

// Build lookup map
const NODE_MAP = Object.fromEntries(NODES.map(n => [n.id, n]));

// ─────────────────────────────────────────────
// Orthogonal (right-angle) edge path: from node exits right, enters target from left
function orthoPath(from, to) {
  const fx = from.x, fy = from.y;
  const tx = to.x,   ty = to.y;
  const mx = (fx + tx) / 2;
  // right-angle: horizontal segment then vertical then horizontal
  return `M ${fx} ${fy} H ${mx} V ${ty} H ${tx}`;
}

// ─────────────────────────────────────────────
// Node component
function SkillNode({ node, onPress }) {
  const Icon = node.icon;
  const r = node.isRoot ? 28 : 24;
  const isLocked = !node.isRoot && !node.unlocked;
  const childEdges = EDGES.filter(e => e.from === node.id);
  const hasChildren = childEdges.length > 0;
  const unlockedChildren = childEdges.filter(e => NODE_MAP[e.to]?.unlocked).length;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: node.isRoot ? 'default' : 'pointer' }}
      onClick={() => !node.isRoot && onPress(node)}
    >
      {/* outer ring */}
      <circle
        r={r + 5}
        fill={node.quizPassed ? '#111' : isLocked ? '#f0f0f0' : '#fff'}
        stroke={node.quizPassed ? '#111' : isLocked ? '#e0e0e0' : '#bbb'}
        strokeWidth={1.5}
      />
      {/* icon */}
      <foreignObject x={-r * 0.55} y={-r * 0.55} width={r * 1.1} height={r * 1.1}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Icon style={{ width: r * 0.65, height: r * 0.65, color: node.quizPassed ? '#fff' : isLocked ? '#ccc' : '#111', flexShrink: 0 }} />
        </div>
      </foreignObject>
      {/* lock badge */}
      {isLocked && (
        <>
          <circle cx={r} cy={-r} r={8} fill="#333" />
          <foreignObject x={r - 8} y={-r - 8} width={16} height={16}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <Lock style={{ width: 9, height: 9, color: '#fff', flexShrink: 0 }} />
            </div>
          </foreignObject>
        </>
      )}
      {/* label */}
      <text y={r + 18} textAnchor="middle" fontSize={10} fontWeight={600} fill={isLocked ? '#bbb' : '#111'}>
        {node.name}
      </text>
      {/* branch count */}
      {hasChildren && (
        <text y={r + 30} textAnchor="middle" fontSize={9} fill="#999">
          {unlockedChildren}/{childEdges.length} 解鎖
        </text>
      )}
    </g>
  );
}

// ─────────────────────────────────────────────
// Detail drawer
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
                : node.unlocked ? '開始測驗'
                : <><Lock className="w-4 h-4" /> 請先完成影片</>}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main
export default function SkillsTab() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [offset, setOffset] = useState({ x: 30, y: 20 });
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastDist = useRef(null);
  const activePointers = useRef({});
  const svgRef = useRef(null);

  const getDistance = (pts) => {
    const ids = Object.keys(pts);
    if (ids.length < 2) return null;
    return Math.hypot(pts[ids[0]].x - pts[ids[1]].x, pts[ids[0]].y - pts[ids[1]].y);
  };
  const getMidpoint = (pts) => {
    const ids = Object.keys(pts);
    if (ids.length < 2) return null;
    return { x: (pts[ids[0]].x + pts[ids[1]].x) / 2, y: (pts[ids[0]].y + pts[ids[1]].y) / 2 };
  };

  const onPointerDown = useCallback((e) => {
    activePointers.current[e.pointerId] = { x: e.clientX, y: e.clientY };
    svgRef.current?.setPointerCapture(e.pointerId);
    if (Object.keys(activePointers.current).length === 1) {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    } else {
      isDragging.current = false;
      lastDist.current = getDistance(activePointers.current);
    }
  }, []);

  const onPointerMove = useCallback((e) => {
    activePointers.current[e.pointerId] = { x: e.clientX, y: e.clientY };
    const count = Object.keys(activePointers.current).length;
    if (count === 2) {
      const newDist = getDistance(activePointers.current);
      const mid = getMidpoint(activePointers.current);
      if (lastDist.current && newDist && mid) {
        const ratio = newDist / lastDist.current;
        setScale(s => {
          const next = Math.min(Math.max(s * ratio, 0.3), 2.5);
          setOffset(o => ({ x: mid.x - (mid.x - o.x) * (next / s), y: mid.y - (mid.y - o.y) * (next / s) }));
          return next;
        });
      }
      lastDist.current = newDist;
    } else if (count === 1 && isDragging.current) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
    }
  }, []);

  const onPointerUp = useCallback((e) => {
    delete activePointers.current[e.pointerId];
    if (Object.keys(activePointers.current).length < 2) lastDist.current = null;
    if (Object.keys(activePointers.current).length === 0) isDragging.current = false;
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => {
      const next = Math.min(Math.max(s * delta, 0.3), 2.5);
      setOffset(o => ({ x: mx - (mx - o.x) * (next / s), y: my - (my - o.y) * (next / s) }));
      return next;
    });
  }, []);

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
        <button onClick={() => setScale(s => Math.min(s + 0.2, 2.5))} className="w-8 h-8 bg-white border border-stone-200 rounded-lg flex items-center justify-center shadow-sm">
          <ZoomIn className="w-4 h-4 text-stone-600" />
        </button>
        <button onClick={() => setScale(s => Math.max(s - 0.2, 0.3))} className="w-8 h-8 bg-white border border-stone-200 rounded-lg flex items-center justify-center shadow-sm">
          <ZoomOut className="w-4 h-4 text-stone-600" />
        </button>
        <button onClick={() => { setOffset({ x: 30, y: 20 }); setScale(1); }} className="w-8 h-8 bg-white border border-stone-200 rounded-lg flex items-center justify-center shadow-sm text-xs text-stone-500 font-bold">
          ↺
        </button>
      </div>

      {/* SVG canvas */}
      <div className="flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
          style={{ touchAction: 'none' }}
        >
          <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
            {/* Edges — orthogonal right-angle lines */}
            {EDGES.map((edge, i) => {
              const from = NODE_MAP[edge.from];
              const to = NODE_MAP[edge.to];
              if (!from || !to) return null;
              return (
                <path
                  key={i}
                  d={orthoPath(from, to)}
                  fill="none"
                  stroke={edge.unlocked ? '#111' : '#ddd'}
                  strokeWidth={edge.unlocked ? 2 : 1.5}
                  strokeDasharray={edge.unlocked ? '' : '5,4'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
            {/* Nodes */}
            {NODES.map(n => (
              <SkillNode key={n.id} node={n} onPress={setSelectedNode} />
            ))}
          </g>
        </svg>
      </div>

      {selectedNode && (
        <SkillDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}