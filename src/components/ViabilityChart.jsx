function scale(value, min, max, size) {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * size;
}

export default function ViabilityChart({ curve = [], threshold = null }) {
  if (!curve.length) {
    return <p className="page__todo">Sem curva para exibir.</p>;
  }

  const width = 640;
  const height = 260;
  const pad = 36;
  const xs = curve.map((point) => point.t);
  const ys = curve.map((point) => point.log10N);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys, threshold ?? Infinity);
  const maxY = Math.max(...ys, threshold ?? -Infinity);

  const points = curve
    .map((point) => {
      const x = pad + scale(point.t, minX, maxX, width - pad * 2);
      const y = height - pad - scale(point.log10N, minY, maxY, height - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const thresholdY = threshold === null ? null : height - pad - scale(threshold, minY, maxY, height - pad * 2);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Curva de viabilidade log10 no tempo">
      <rect x="0" y="0" width={width} height={height} rx="8" fill="#0f172a" />
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#64748b" />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#64748b" />
      {thresholdY !== null && (
        <line x1={pad} y1={thresholdY} x2={width - pad} y2={thresholdY} stroke="#fbbf24" strokeDasharray="6 6" />
      )}
      <polyline fill="none" stroke="#38bdf8" strokeWidth="3" points={points} />
      <text x={pad} y={height - 8} fill="#94a3b8" fontSize="12">tempo</text>
      <text x="8" y={pad - 10} fill="#94a3b8" fontSize="12">log10 UFC</text>
    </svg>
  );
}
