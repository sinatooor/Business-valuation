// src/components/ValuationDecisionTree.jsx

import React, { useCallback, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HelpCircle,
  Landmark,
  Boxes,
  Building2,
  TrendingUp,
} from "lucide-react";
import dagre from "dagre";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

// -----------------------------------------------------------------------------
// ICONS BY VALUATION APPROACH
// -----------------------------------------------------------------------------

const categoryIcon = {
  question: <HelpCircle size={20} className="text-gray-500" />,
  income: <Landmark size={20} className="text-sky-700" />,
  market: <Boxes size={20} className="text-emerald-700" />,
  asset: <Building2 size={20} className="text-amber-700" />,
  option: <TrendingUp size={20} className="text-purple-700" />,
};

// -----------------------------------------------------------------------------
// CUSTOM NODE COMPONENT
// -----------------------------------------------------------------------------

const NodeBox = ({ data, selected }) => {
  const Icon = categoryIcon[data.nodeKind === "question" ? "question" : data.category];
  const bgClass = data.nodeKind === "question"
    ? "bg-slate-50 border-slate-200"
    : {
        income: "bg-sky-50 border-sky-200",
        market: "bg-emerald-50 border-emerald-200",
        asset: "bg-amber-50 border-amber-200",
        option: "bg-purple-50 border-purple-200",
      }[data.category];
  const selectedClass = selected ? "!border-indigo-500 shadow-xl" : "";

  return (
    <div
      className={`p-3 rounded-lg shadow-md border-2 flex items-center gap-3 transition-all duration-200 ${bgClass} ${selectedClass}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      {Icon}
      <div className="text-sm font-medium text-slate-800 whitespace-pre-wrap">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
};

const nodeTypes = { coloredNode: NodeBox };

// -----------------------------------------------------------------------------
// DAGRE LAYOUT SETUP
// -----------------------------------------------------------------------------

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = "TB") => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => dagreGraph.setNode(node.id, { width: 220, height: 90 }));
  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const { x, y } = dagreGraph.node(node.id);
    node.position = { x: x - 110, y: y - 45 };
    node.targetPosition = "top";
    node.sourcePosition = "bottom";
  });

  return { nodes, edges };
};

// -----------------------------------------------------------------------------
// NODE FACTORY + HELPERS
// -----------------------------------------------------------------------------

const makeModelNode = (id, label, category, formula, details) => ({
  id,
  type: "coloredNode",
  data: {
    id,
    label,
    category,
    nodeKind: "model",
    formula,
    description: details,
  },
});

const bullet = (txt) => `• ${txt}`;

// -----------------------------------------------------------------------------
// NODE DEFINITIONS
// -----------------------------------------------------------------------------

const initialNodesData = [
  // Start
  { id: "start", type: "input", data: { label: "Start" } },

  // Questions
  { id: "q1", type: "coloredNode", data: { label: "Mature with\nstable cash flows?", nodeKind: "question" } },
  { id: "q1a", type: "coloredNode", data: { label: "Intangible-heavy\n or multi-segment?", nodeKind: "question" } },
  { id: "q2", type: "coloredNode", data: { label: "Reliable multi-year\n projections?", nodeKind: "question" } },
  { id: "q3", type: "coloredNode", data: { label: "Early-stage,\n high growth?", nodeKind: "question" } },
  { id: "q4", type: "coloredNode", data: { label: "Asset-rich or\n distressed?", nodeKind: "question" } },
  { id: "q4a", type: "coloredNode", data: { label: "Cease vs\ncontinue ops?", nodeKind: "question" } },
  { id: "q4b", type: "coloredNode", data: { label: "Cheaper to\nre-build?", nodeKind: "question" } },
  { id: "q5", type: "coloredNode", data: { label: "Good market\n comparables?", nodeKind: "question" } },
  { id: "q6", type: "coloredNode", data: { label: "PE LBO\n scenario?", nodeKind: "question" } },

  // Income approach models
  makeModelNode(
    "ccf",
    "Capitalized Cash-Flow",
    "income",
    "V = \\frac{CF_1}{k-g}",
    [
      bullet("V = value of the business (equity or enterprise)"),
      bullet("CF₁ = next-period normalized cash flow"),
      bullet("k = discount rate / required return"),
      bullet("g = perpetual growth rate"),
      "\nHow to use:\n",
      bullet("Pick steady-state CF₁ (often forecast year 1)"),
      bullet("Estimate k via WACC or build‑up"),
      bullet("Choose g reflecting long‑run inflation + real growth"),
      "\nBe careful:\n",
      bullet("Very sensitive when g ≈ k"),
      bullet("Assumes constant growth forever"),
    ].join("\n")
  ),
  makeModelNode(
    "residual",
    "Residual / Excess Earnings",
    "income",
    "V = BV_0 + \\sum_{t=1}^{n} \\frac{NI_t - k\\,BV_{t-1}}{(1+k)^t}",
    [
      bullet("BV₀ = opening book equity"),
      bullet("NI_t = net income in year t"),
      bullet("k = cost of equity"),
      "\nHow to use:\n",
      bullet("Project NI and book value by segment"),
      bullet("Add PV of economic profit to BV₀"),
      "\nBe careful:\n",
      bullet("Needs clean accrual accounting"),
      bullet("Sensitive to cost‑of‑capital estimate"),
    ].join("\n")
  ),
  makeModelNode(
    "dcf",
    "Discounted Cash‑Flow",
    "income",
    "V = \\sum_{t=1}^{n} \\frac{CF_t}{(1+k)^t} + \\frac{CF_{n+1}}{(k-g)(1+k)^n}",
    [
      bullet("CF_t = free cash flow in year t"),
      bullet("k = discount rate (WACC)"),
      bullet("g = perpetual growth"),
      "\nHow to use:\n",
      bullet("Model 3‑10 years of explicit CF"),
      bullet("Compute terminal value with Gordon‑growth"),
      bullet("Discount all CF to today"),
      "\nBe careful:\n",
      bullet("Forecast errors propagate"),
      bullet("Terminal assumptions often >50 % of value"),
    ].join("\n")
  ),
  makeModelNode(
    "vc",
    "VC / First‑Chicago",
    "income",
    "V = \\frac{\\sum p_i\\,Exit_i}{(1+IRR)^T}",
    [
      bullet("p_i = probability of scenario i"),
      bullet("Exit_i = equity value at exit"),
      bullet("IRR = target venture return"),
      bullet("T = years to exit (5‑7)"),
      "\nHow to use:\n",
      bullet("Define pessimistic / base / optimistic exits"),
      bullet("Discount to PV at target IRR"),
      "\nBe careful:\n",
      bullet("Ignores interim dilution"),
      bullet("Highly sensitive to exit multiple"),
    ].join("\n")
  ),

  // Asset approach models
  makeModelNode(
    "asset",
    "Adjusted Net Asset Value",
    "asset",
    "V = \\sum FMV_{assets} - \\sum FMV_{liabilities}",
    [
      bullet("FMV_{assets} = fair‑value of each asset"),
      bullet("FMV_{liabilities} = fair‑value of debts"),
      "\nHow to use:\n",
      bullet("Revalue PP&E, intangibles, WC"),
      bullet("Subtract market‑value of debt"),
      "\nBe careful:\n",
      bullet("Time‑consuming asset appraisals"),
      bullet("Ignores going‑concern synergies"),
    ].join("\n")
  ),
  makeModelNode(
    "replace",
    "Replacement Cost",
    "asset",
    "V ≈ \\sum ReplacementCost_i - AccumDeppr",
    [
      bullet("ReplacementCost_i = cost to rebuild asset i"),
      bullet("AccumDeppr = economic depreciation"),
      "\nHow to use:\n",
      bullet("Useful for regulated utilities & IP"),
      bullet("Acts as ceiling to value"),
      "\nBe careful:\n",
      bullet("May exceed earning power"),
      bullet("Tech obsolescence risk"),
    ].join("\n")
  ),
  makeModelNode(
    "liquidation",
    "Liquidation Value",
    "asset",
    "V = (\\sum QuickSale_i - Liabilities)e^{-rT}",
    [
      bullet("QuickSale_i = forced‑sale proceeds"),
      bullet("Liabilities = senior obligations"),
      bullet("r = discount for holding period"),
      bullet("T = months until sale"),
      "\nHow to use:\n",
      bullet("Floor value in distress"),
      bullet("Collateral coverage tests"),
      "\nBe careful:\n",
      bullet("Subjective illiquidity discounts"),
      bullet("Often far below going‑concern value"),
    ].join("\n")
  ),

  // Market approach
  makeModelNode(
    "market",
    "Market Multiples",
    "market",
    "V = Multiple \\times Metric",
    [
      bullet("Metric = EBITDA, EBIT, revenue"),
      bullet("Multiple = peer median multiple"),
      "\nHow to use:\n",
      bullet("Pick peer set similar in size, growth, risk"),
      bullet("Apply control premium / illiquidity discount"),
      "\nBe careful:\n",
      bullet("Sparse comps can mislead"),
      bullet("Need forward multiples if growth differs"),
    ].join("\n")
  ),

  // Option / hybrid
  makeModelNode(
    "lbo",
    "LBO Back‑Solve",
    "option",
    "Solve\;P:\;IRR_{equity}=Target",
    [
      bullet("P = max purchase price"),
      bullet("IRR_{equity} = equity IRR"),
      "\nHow to use:\n",
      bullet("Model debt schedule, exit multiple"),
      bullet("Back‑solve P where IRR hits 20‑30 %"),
      "\nBe careful:\n",
      bullet("Leverage & exit assumptions dominate"),
      bullet("Not a standalone fair value"),
    ].join("\n")
  ),
  makeModelNode(
    "option",
    "Real Options",
    "option",
    "V = S\,N(d_1) - Ke^{-rT}N(d_2)",
    [
      bullet("S = PV of underlying asset"),
      bullet("K = investment cost (exercise price)"),
      bullet("r = risk‑free rate"),
      bullet("T = time to decision"),
      "\nHow to use:\n",
      bullet("Value expand / defer / abandon options"),
      bullet("Use binomial or Monte‑Carlo for complex paths"),
      "\nBe careful:\n",
      bullet("Volatility input hard to estimate"),
      bullet("Complex models can obscure key drivers"),
    ].join("\n")
  
  ),
];

// -----------------------------------------------------------------------------
// EDGE DEFINITIONS
// -----------------------------------------------------------------------------

const e = (id, source, target, label = "") => ({
  id,
  source,
  target,
  label,
  type: "smoothstep",
  markerEnd: { type: "arrowclosed" },
});

const initialEdgesData = [
  { id: "e0", source: "start", target: "q1", animated: true, style: { strokeWidth: 2 } },
  e("e1", "q1", "q1a", "Yes"),
  e("e2", "q1", "q2", "No"),
  e("e3", "q1a", "residual", "Yes"),
  e("e4", "q1a", "ccf", "No"),
  e("e5", "q2", "dcf", "Yes"),
  e("e6", "q2", "q3", "No"),
  e("e7", "q3", "vc", "Yes"),
  e("e8", "q3", "q4", "No"),
  e("e9", "q4", "q4a", "Yes"),
  e("e10", "q4", "q5", "No"),
  e("e11", "q4a", "liquidation", "No"),
  e("e12", "q4a", "q4b", "Yes"),
  e("e13", "q4b", "replace", "Yes"),
  e("e14", "q4b", "asset", "No"),
  e("e15", "q5", "market", "Yes"),
  e("e16", "q5", "q6", "No"),
  e("e17", "q6", "lbo", "Yes"),
  e("e18", "q6", "option", "No"),
];

const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
  initialNodesData,
  initialEdgesData
);

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------

export default function ValuationDecisionTree() {
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);
  const [selectedNodeData, setSelectedNodeData] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onNodeClick = useCallback((_, node) => {
    if (node?.data?.nodeKind === "model") {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, selected: n.id === node.id },
        }))
      );
      setSelectedNodeData(node.data);
    } else {
      setNodes((nds) =>
        nds.map((n) => ({ ...n, data: { ...n.data, selected: false } }))
      );
      setSelectedNodeData(null);
    }
  }, []);

  return (
    <div className="h-full w-full relative bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        className="bg-gradient-to-br from-white to-slate-100"
      >
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Background color="#aaa" gap={16} />
      </ReactFlow>

      {selectedNodeData && (
        <Card className="fixed top-4 right-4 w-[28rem] max-h-[90vh] overflow-y-auto shadow-xl bg-white/90 backdrop-blur-md border-gray-300 animate-in fade-in slide-in-from-top duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-800">
              {categoryIcon[selectedNodeData.category]} {selectedNodeData.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-700">
            <BlockMath math={selectedNodeData.formula} />
            <pre className="whitespace-pre-wrap font-sans text-sm leading-5">
              {selectedNodeData.description}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
