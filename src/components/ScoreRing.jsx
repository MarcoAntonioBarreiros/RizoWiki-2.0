const STATUS_COLOR = {
  recomendado: '#22c55e',
  ajustar: '#fbbf24',
  evitar_agora: '#ef4444',
};

export default function ScoreRing({ score = 0, status = 'ajustar', label = 'score' }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const color = STATUS_COLOR[status] || STATUS_COLOR.ajustar;

  return (
    <div
      className="score-ring"
      style={{ '--score': `${safeScore}%`, '--score-color': color }}
      title={`${label}: ${safeScore}`}
      aria-label={`${label}: ${safeScore}`}
    >
      <span>{safeScore}</span>
      <small>{label}</small>
    </div>
  );
}
