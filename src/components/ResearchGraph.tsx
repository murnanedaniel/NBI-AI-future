"use client";

import { useMemo, useState } from "react";
import graphData from "@/data/nbi_research_graph.json";
import { sectionColor as sharedSectionColor } from "@/lib/sectionColors";

type Node = {
  id: string;
  name: string;
  section: string;
  rank: string;
  title: string;
  x: number;
  y: number;
  has_p: boolean;
  has_w: boolean;
  valid: boolean;
  p_text: string;
  w_text: string;
};

type Edge = {
  source: string;
  target: string;
  w_sim: number;
  p_sim: number;
  score: number;
  mutual: boolean;
};

type Graph = {
  meta: Record<string, unknown>;
  nodes: Node[];
  edges: Edge[];
};

const graph = graphData as unknown as Graph;

const SECTION_COLORS: Record<string, string> = {
  "Climate and Geophysics": "#60a5fa",
  "Theoretical Particle Physics and Cosmology": "#c084fc",
  "Quantum Optics": "#2dd4bf",
  "Condensed Matter Physics": "#86efac",
  "Cosmic Dawn Center (DAWN)": "#f472b6",
  "Experimental Subatomic Physics": "#fb923c",
  "Biophysics": "#4ade80",
  "Astrophysics and Planetary Science": "#facc15",
  "Dark Cosmology Centre (DARK)": "#a78bfa",
  "Niels Bohr International Academy": "#818cf8",
  "Support": "#71717a",
};

function sectionColor(section: string): string {
  return SECTION_COLORS[section] ?? "#a1a1aa";
}

const PAD = 0.06;
const VIEW_W = 1000;
const VIEW_H = 700;

function sx(x: number): number {
  return PAD * VIEW_W + x * (1 - 2 * PAD) * VIEW_W;
}
function sy(y: number): number {
  return PAD * VIEW_H + (1 - y) * (1 - 2 * PAD) * VIEW_H;
}

export function ResearchGraph() {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mutualOnly, setMutualOnly] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());

  const nodeById = useMemo(
    () => Object.fromEntries(graph.nodes.map((n) => [n.id, n])),
    [],
  );

  const sections = useMemo(() => {
    const s = new Map<string, number>();
    for (const n of graph.nodes) s.set(n.section, (s.get(n.section) ?? 0) + 1);
    return Array.from(s.entries()).sort((a, b) => b[1] - a[1]);
  }, []);

  const visibleNodes = useMemo(
    () => graph.nodes.filter((n) => !hiddenSections.has(n.section)),
    [hiddenSections],
  );
  const visibleIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes],
  );

  const visibleEdges = useMemo(
    () =>
      graph.edges.filter(
        (e) =>
          (!mutualOnly || e.mutual) &&
          e.score >= minScore &&
          visibleIds.has(e.source) &&
          visibleIds.has(e.target),
      ),
    [mutualOnly, minScore, visibleIds],
  );

  const degree = useMemo(() => {
    const d = new Map<string, number>();
    for (const e of visibleEdges) {
      d.set(e.source, (d.get(e.source) ?? 0) + 1);
      d.set(e.target, (d.get(e.target) ?? 0) + 1);
    }
    return d;
  }, [visibleEdges]);

  const focusId = selectedId ?? hoverId;
  const focusNeighbors = useMemo(() => {
    if (!focusId) return new Set<string>();
    const s = new Set<string>();
    for (const e of visibleEdges) {
      if (e.source === focusId) s.add(e.target);
      if (e.target === focusId) s.add(e.source);
    }
    return s;
  }, [focusId, visibleEdges]);

  const selected = selectedId ? nodeById[selectedId] : null;
  const selectedEdges = selected
    ? visibleEdges
        .filter((e) => e.source === selected.id || e.target === selected.id)
        .sort((a, b) => b.score - a.score)
    : [];

  function toggleSection(s: string) {
    setHiddenSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  return (
    <div className="relative w-full h-screen bg-[var(--canvas)] text-zinc-100 overflow-hidden">
      <div className="absolute top-4 left-4 z-10 max-w-xs text-xs text-zinc-400 leading-relaxed pointer-events-none">
        <div className="text-sm font-semibold text-zinc-200 mb-1">
          NBI research graph
        </div>
        <div>
          124 faculty · {graph.edges.length} bridge edges (KNN={3} on
          W−P score) · PCA(P) layout
        </div>
        <div className="text-[10px] mt-1 opacity-70">
          Hover = highlight · Click = inspect · High W + low P = different
          backgrounds, overlapping current work
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-sm border border-zinc-800 rounded p-3 text-xs pointer-events-auto w-64">
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={mutualOnly}
            onChange={(e) => setMutualOnly(e.target.checked)}
          />
          <span>mutual-KNN only ({graph.edges.filter((e) => e.mutual).length})</span>
        </label>
        <label className="block mb-3">
          <span className="block mb-1">min score: {minScore.toFixed(2)}</span>
          <input
            type="range"
            min={-0.1}
            max={0.3}
            step={0.01}
            value={minScore}
            onChange={(e) => setMinScore(parseFloat(e.target.value))}
            className="w-full"
          />
        </label>
        <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">
          sections (click to toggle)
        </div>
        <div className="space-y-0.5 max-h-64 overflow-y-auto">
          {sections.map(([s, n]) => {
            const hidden = hiddenSections.has(s);
            return (
              <button
                key={s}
                onClick={() => toggleSection(s)}
                className={`flex items-center gap-2 w-full text-left py-0.5 ${
                  hidden ? "opacity-30" : "opacity-100"
                }`}
              >
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ background: sectionColor(s) }}
                />
                <span className="flex-1 truncate">{s}</span>
                <span className="text-zinc-500">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        onClick={() => setSelectedId(null)}
      >
        <g>
          {visibleEdges.map((e, i) => {
            const a = nodeById[e.source];
            const b = nodeById[e.target];
            if (!a || !b) return null;
            const focused =
              focusId === a.id ||
              focusId === b.id ||
              (selectedId !== null &&
                (focusNeighbors.has(a.id) || focusNeighbors.has(b.id)));
            const dimmed = focusId !== null && !focused;
            const stroke = e.mutual ? "#fbbf24" : "#3b82f6";
            const baseOpacity = e.mutual ? 0.55 : 0.22;
            const opacity = dimmed
              ? 0.04
              : focused
                ? Math.min(1, baseOpacity + 0.35)
                : baseOpacity;
            const width = e.mutual ? 1.4 : 0.7;
            return (
              <line
                key={i}
                x1={sx(a.x)}
                y1={sy(a.y)}
                x2={sx(b.x)}
                y2={sy(b.y)}
                stroke={stroke}
                strokeOpacity={opacity}
                strokeWidth={focused ? width * 1.8 : width}
              />
            );
          })}
        </g>
        <g>
          {visibleNodes.map((n) => {
            const d = degree.get(n.id) ?? 0;
            const r = 3.5 + Math.min(8, Math.sqrt(d) * 1.6);
            const isFocus = focusId === n.id;
            const isNeighbor = focusNeighbors.has(n.id);
            const dimmed = focusId !== null && !isFocus && !isNeighbor;
            const color = sectionColor(n.section);
            return (
              <g
                key={n.id}
                transform={`translate(${sx(n.x)}, ${sy(n.y)})`}
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId((id) => (id === n.id ? null : id))}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setSelectedId((id) => (id === n.id ? null : n.id));
                }}
                style={{ cursor: "pointer" }}
              >
                <circle
                  r={r}
                  fill={color}
                  fillOpacity={dimmed ? 0.15 : 1}
                  stroke={isFocus ? "#fff" : "rgba(0,0,0,0.4)"}
                  strokeWidth={isFocus ? 2 : 0.5}
                />
                {(isFocus || isNeighbor || d >= 8) && (
                  <text
                    x={r + 3}
                    y={3}
                    fontSize={10}
                    fill={dimmed ? "#71717a" : "#e4e4e7"}
                    style={{ pointerEvents: "none" }}
                  >
                    {n.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {hoverId && !selectedId && (
        <HoverCard node={nodeById[hoverId]} degree={degree.get(hoverId) ?? 0} />
      )}

      {selected && (
        <InspectPanel
          node={selected}
          edges={selectedEdges}
          nodeById={nodeById}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function HoverCard({ node, degree }: { node: Node; degree: number }) {
  return (
    <div className="absolute bottom-4 left-4 z-20 max-w-md bg-black/70 backdrop-blur-sm border border-zinc-700 rounded p-3 text-xs pointer-events-none">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block w-3 h-3 rounded-full"
          style={{ background: sectionColor(node.section) }}
        />
        <span className="text-sm font-semibold text-zinc-100">{node.name}</span>
      </div>
      <div className="text-zinc-400">
        {node.title} · {node.section} · {degree} bridges
      </div>
      <div className="text-zinc-500 mt-2 line-clamp-3">{node.w_text}</div>
    </div>
  );
}

function InspectPanel({
  node,
  edges,
  nodeById,
  onClose,
}: {
  node: Node;
  edges: Edge[];
  nodeById: Record<string, Node>;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute top-0 right-0 h-full w-[420px] z-30 bg-zinc-950/95 backdrop-blur-sm border-l border-zinc-800 p-5 overflow-y-auto text-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: sectionColor(node.section) }}
            />
            <h2 className="text-lg font-semibold text-zinc-100">{node.name}</h2>
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">
            {node.title} · {node.section}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-100 text-xl leading-none px-2"
          aria-label="close"
        >
          ×
        </button>
      </div>

      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">
          P · background
        </div>
        <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
          {node.p_text || <span className="italic text-zinc-500">empty</span>}
        </p>
      </div>

      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">
          W · ongoing work
        </div>
        <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
          {node.w_text || <span className="italic text-zinc-500">empty</span>}
        </p>
      </div>

      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-2">
          {edges.length} bridges · sorted by W−P score
        </div>
        <ul className="space-y-1.5">
          {edges.map((e, i) => {
            const otherId = e.source === node.id ? e.target : e.source;
            const other = nodeById[otherId];
            if (!other) return null;
            return (
              <li
                key={i}
                className="flex items-start gap-2 text-xs border-t border-zinc-900 pt-1.5"
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                  style={{ background: sectionColor(other.section) }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-zinc-200">
                      {other.name}
                      {e.mutual && (
                        <span className="ml-1 text-amber-400" title="mutual KNN">
                          ⇆
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400 shrink-0">
                      W {e.w_sim.toFixed(2)} · P {e.p_sim.toFixed(2)} · s{" "}
                      {e.score.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-zinc-500 truncate">{other.section}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
