const LEVELS = {
  alta: { label: 'Confianca alta', color: '#22c55e' },
  media: { label: 'Confianca media', color: '#fbbf24' },
  baixa: { label: 'Confianca baixa', color: '#f97316' },
  inconclusiva: { label: 'Inconclusivo', color: '#ef4444' },
};

export default function ConfidenceBadge({ level = 'baixa' }) {
  const cfg = LEVELS[level] ?? LEVELS.baixa;
  return (
    <span
      title={`Nivel de confianca: ${cfg.label}`}
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.6rem',
        borderRadius: '999px',
        fontSize: '0.78rem',
        fontWeight: 600,
        color: '#06283d',
        background: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}
