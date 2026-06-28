import ScoreRing from './ScoreRing.jsx';

const STATUS_LABEL = {
  recomendado: 'Recomendado',
  ajustar: 'Usar com ajustes',
  evitar_agora: 'Evitar agora',
};

const RISK_LABEL = {
  go: 'go',
  atencao: 'atencao',
  nogo: 'no-go',
};

function MiniList({ title, items, tone = 'muted' }) {
  if (!items || items.length === 0) return null;

  return (
    <div className={`mini-list mini-list--${tone}`}>
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function RecommendationCard({ item, index, isTop, onSelect }) {
  return (
    <article className={'recommendation-card' + (isTop ? ' recommendation-card--top' : '')}>
      <div className="recommendation-card__rank">{index + 1}</div>
      <ScoreRing score={item.score} status={item.status} />

      <div className="recommendation-card__body">
        <div className="recommendation-card__header">
          <div>
            <h4>{item.label}</h4>
            <span className={`status-chip status-chip--${item.status}`}>
              {STATUS_LABEL[item.status] || item.status}
            </span>
            <span className={`status-chip status-chip--risk-${item.riskSemaphore}`}>
              risco {RISK_LABEL[item.riskSemaphore] || item.riskSemaphore}
            </span>
            {isTop && <span className="status-chip status-chip--top">melhor ajuste</span>}
          </div>
          <button className="app__tab app__tab--small" onClick={() => onSelect(item.organism)}>
            Usar na ficha
          </button>
        </div>

        <div className="recommendation-card__grid">
          <MiniList title="Por que entrou" items={item.reasons} />
          <MiniList title="Alertas" items={item.alerts} tone="warn" />
          <MiniList title="Acoes" items={item.actions} />
        </div>
      </div>
    </article>
  );
}
