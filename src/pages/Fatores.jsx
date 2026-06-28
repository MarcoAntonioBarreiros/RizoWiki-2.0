// Fatores - checklist go/no-go "vou aplicar agora?" (brief secao 6).
// Integrado: barra de caso compartilhado (mesmo organismo/caso do Mapa e do Lab) + mesmo design
// system do Mapa + sinal da analise de solo (limitacao de base). A decisao go/no-go vive no
// riskAssessment, que reusa os motores (AGENTS.md regra 5).
import { useMemo } from 'react';
import CaseContextBar from '../components/CaseContextBar.jsx';
import RiskPanel from '../components/RiskPanel.jsx';
import ConfidenceBadge from '../components/ConfidenceBadge.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import { assessApplication } from '../utils/riskAssessment.js';
import { buildSoilSummary } from '../engines/soil/soilSummary.js';
import { DISCLAIMER } from '../disclaimer.js';

const VERDICT = {
  go: { label: 'pode aplicar', cls: 'go' },
  atencao: { label: 'ajustar antes de aplicar', cls: 'atencao' },
  nogo: { label: 'nao aplicar agora', cls: 'nogo' },
  inconclusiva: { label: 'inconclusivo - dados insuficientes', cls: 'atencao' },
};

function riskChipCls(semaphore) {
  if (semaphore === 'go') return 'risk-go';
  if (semaphore === 'nogo') return 'risk-nogo';
  return 'risk-atencao';
}

function scoreStatus(semaphore) {
  if (semaphore === 'go') return 'recomendado';
  if (semaphore === 'nogo') return 'evitar_agora';
  return 'ajustar';
}

function levelLabel(level) {
  if (level === 'go') return 'OK';
  if (level === 'nogo') return 'NO-GO';
  return 'ATENCAO';
}

function CategoryCard({ item }) {
  return (
    <div className={`factor-card factor-card--${item.nivel}`}>
      <span className={`status-dot status-dot--${item.nivel}`} />
      <strong>{item.label}</strong>
      <small>{levelLabel(item.nivel)}{item.count ? ` - ${item.count} alerta(s)` : ''}</small>
    </div>
  );
}

function EvaluationTable({ evaluations }) {
  return (
    <div className="table-wrap">
      <table className="data-table factor-table">
        <thead>
          <tr>
            <th>Fator</th>
            <th>Valor informado</th>
            <th>Limite operacional</th>
            <th>Resultado</th>
            <th>Fonte</th>
          </tr>
        </thead>
        <tbody>
          {evaluations.map((item) => (
            <tr key={`${item.id}-${item.parametro}-${item.resultado}`}>
              <th>
                <span className={`status-chip status-chip--${riskChipCls(item.nivel)}`}>
                  {levelLabel(item.nivel)}
                </span>
                <span>{item.parametro}</span>
              </th>
              <td>{item.valor || '-'}</td>
              <td>{item.limite || '-'}</td>
              <td>
                <strong>{item.resultado}</strong>
                {item.acao && <small>Acao: {item.acao}</small>}
              </td>
              <td>{item.fonte || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionsPanel({ flags, baseTipos }) {
  const actions = flags.map((flag) => ({
    title: flag.mensagem,
    action: flag.acao,
    source: flag.fonte,
    level: flag.nivel,
  }));
  if (baseTipos.length > 0) {
    actions.unshift({
      title: `Limitacao de base real: ${baseTipos.join(' e ')}`,
      action: 'Corrigir a base antes; o bioinsumo e complemento neste caso.',
      source: 'analise de solo interpretada',
      level: 'atencao',
    });
  }

  return (
    <div className="factor-actions">
      {actions.length > 0 ? (
        actions.map((item, idx) => (
          <article key={`${item.title}-${idx}`} className={`factor-action factor-action--${item.level}`}>
            <strong>{item.title}</strong>
            <p>{item.action}</p>
            <small>{item.source}</small>
          </article>
        ))
      ) : (
        <article className="factor-action factor-action--go">
          <strong>Nenhuma acao corretiva obrigatoria</strong>
          <p>As condicoes informadas estao dentro dos limites operacionais cadastrados.</p>
          <small>limites_operacionais</small>
        </article>
      )}
    </div>
  );
}

export default function Fatores({ caseState, onCaseChange }) {
  const form = caseState;
  const onChange = onCaseChange;
  const result = useMemo(() => assessApplication(form), [form]);
  const verdict = VERDICT[result.semaphore] ?? VERDICT.atencao;

  // Mesmo sinal de solo do Mapa: limitacao de base REAL (acidez/compactacao) -> bioinsumo nao e a
  // alavanca. Aqui aparece como contexto (nao muda o veredito operacional go/no-go).
  const soil = useMemo(() => buildSoilSummary(form), [form]);
  const baseTipos = [];
  if (soil.acidez.acidez_limitante && soil.acidez.origem === 'real') baseTipos.push('acidez');
  if (
    soil.compactacao.compactado &&
    soil.compactacao.restricao === 'severa' &&
    soil.compactacao.origem === 'real'
  ) {
    baseTipos.push('compactacao');
  }
  const sources = Array.from(new Set(result.evaluations.map((item) => item.fonte).filter(Boolean)));

  return (
    <section className="page-stack">
      <CaseContextBar caseState={form} onCaseChange={onChange} active="fatores" />

      <div className="map-panel">
        <div className="map-panel__header">
          <div>
            <h3>Vou aplicar agora?</h3>
            <p>Veredito por limites operacionais: bloqueia so com fonte dura; o resto vira acao de ajuste.</p>
          </div>
          <ConfidenceBadge level={result.confidence} />
        </div>

        <div className="factor-dashboard">
          <ScoreRing score={result.score} status={scoreStatus(result.semaphore)} label="risco" />
          <div className="factor-dashboard__main">
            <div className={`verdict-banner verdict-banner--${verdict.cls}`}>
              <span className={`status-chip status-chip--${riskChipCls(result.semaphore)}`}>
                {String(result.semaphore).toUpperCase()}
              </span>
              {verdict.label}
            </div>
            <div className="factor-category-grid">
              {result.categories.map((item) => (
                <CategoryCard key={item.categoria} item={item} />
              ))}
            </div>
          </div>
        </div>

        {baseTipos.length > 0 && (
          <div className="alert-box alert-box--warn" style={{ marginTop: '0.7rem' }}>
            A analise de solo aponta limitacao de base real ({baseTipos.join(' e ')}): corrija a base
            (calagem/descompactacao) antes; aqui o bioinsumo e complemento, nao a alavanca.
          </div>
        )}
      </div>

      <div className="map-panel">
        <div className="map-panel__header">
          <div>
            <h3>Fatores informados</h3>
            <p>Edite o cenário operacional; a tabela abaixo mostra como cada item foi avaliado.</p>
          </div>
        </div>
        <RiskPanel value={form} onChange={onChange} />
      </div>

      <div className="map-panel">
        <div className="map-panel__header">
          <div>
            <h3>Limites operacionais avaliados</h3>
            <p>Valor informado, limite documentado, resultado e fonte para cada fator.</p>
          </div>
        </div>
        <EvaluationTable evaluations={result.evaluations} />
      </div>

      <div className="map-panel">
        <div className="map-panel__header">
          <div>
            <h3>Como virar GO</h3>
            <p>Acoes corretivas priorizadas para aplicar com menor risco operacional.</p>
          </div>
        </div>
        <ActionsPanel flags={result.flags} baseTipos={baseTipos} />
      </div>

      {sources.length > 0 && (
        <div className="map-panel">
          <div className="map-panel__header">
            <div>
              <h3>Fontes usadas no veredito</h3>
              <p>Referencias declaradas nos limites operacionais e regras de compatibilidade.</p>
            </div>
          </div>
          <div className="source-chip-row">
            {sources.map((source) => (
              <span key={source} className="source-chip">{source}</span>
            ))}
          </div>
        </div>
      )}

      {result.limitations.length > 0 && (
        <details className="map-details">
          <summary>Limites e premissas</summary>
          <ul>
            {result.limitations.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </details>
      )}

      <p className="map-disclaimer">{DISCLAIMER}</p>
    </section>
  );
}
