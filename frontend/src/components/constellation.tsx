// A quiet picture of dots joined by lines, like the logo (a knowledge graph). It is only
// decoration (aria-hidden), drawn in the colors of the navy brand panel it sits on.
// One amber dot is the "live point" of the brand.

const NODES: [number, number][] = [
  [40, 60], [120, 30], [210, 80], [300, 40], [370, 110],
  [70, 150], [160, 140], [250, 170], [340, 210], [30, 240],
  [110, 260], [200, 250], [290, 300], [60, 340], [160, 360],
  [250, 380], [350, 350],
];

const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [1, 6], [2, 6], [2, 7], [3, 8], [4, 8],
  [5, 6], [6, 7], [7, 8], [5, 9], [5, 10], [6, 11], [7, 11], [8, 12], [9, 10],
  [10, 11], [11, 12], [10, 13], [11, 14], [12, 15], [12, 16], [13, 14], [14, 15], [15, 16],
];

const LIVE_NODE = 6; // the amber dot

export default function Constellation({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 420" aria-hidden="true" className={className} fill="none">
      <g className="text-on-brand/25" stroke="currentColor" strokeWidth={1}>
        {EDGES.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />
        ))}
      </g>
      <g className="text-on-brand/60" fill="currentColor">
        {NODES.map(([x, y], index) =>
          index === LIVE_NODE ? null : <circle key={index} cx={x} cy={y} r={index % 3 === 0 ? 4 : 3} />,
        )}
      </g>
      <circle cx={NODES[LIVE_NODE][0]} cy={NODES[LIVE_NODE][1]} r={7} className="fill-live" />
    </svg>
  );
}
