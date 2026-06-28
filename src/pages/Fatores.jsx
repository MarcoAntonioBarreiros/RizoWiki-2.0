// Fatores - checklist go/no-go "vou aplicar agora?" (brief secao 6).
// Integrado: barra de caso compartilhado (mesmo organismo/caso do Mapa e do Lab) + mesmo design
// system do Mapa + sinal da analise de solo (limitacao de base). A decisao go/no-go vive no
// riskAssessment, que reusa os motores (AGENTS.md regra 5).
import { useMemo } from 'react';
import CaseContextBar from '../components/CaseContextBar.jsx';
import RiskPanel from '../components/RiskPanel.jsx';
import ConfidenceBadge from '../components/ConfidenceBadge.jsx';
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

  return (
    <section className="page-stack">
      <CaseContextBar caseState={form} onCaseChange={onChange} active="fatores" />

      <div className="map-panel">
        <div className="map-panel__header">
          <div>
            <h3>Vou aplicar agora?</h3>
            <p>Veredito por LIMITES OPERACIONAIS com fonte: bloqueia so com fonte dura; o resto e risco.</p>
          </div>
          <ConfidenceBadge level={result.confidence} />
        </div>

        <RiskPanel value={form} onChange={onChange} />

        <div className={`verdict-banner verdict-banner--${verdict.cls}`}>
          <span className={`status-chip status-chip--${riskChipCls(result.semaphore)}`}>
            {String(result.semaphore).toUpperCase()}
          </span>
          {verdict.label}
        </div>

        {baseTipos.length > 0 && (
          <div className="alert-box alert-box--warn" style={{ marginTop: '0.7rem' }}>
            A analise de solo aponta limitacao de base real ({baseTipos.join(' e ')}): corrija a base
            (calagem/descompactacao) antes; aqui o bioinsumo e complemento, nao a alavanca.
          </div>
        )}

        {result.flags.length > 0 ? (
          <div className="flag-list" style={{ marginTop: '0.7rem' }}>
            {result.flags.map((flag, idx) => (
              <div key={idx} className={`flag-item${flag.nivel === 'nogo' ? ' flag-item--nogo' : ''}`}>
                <strong>{flag.mensagem}</strong>
                <small>
                  Acao: {flag.acao}
                  {flag.fonte ? ` - Fonte: ${flag.fonte}` : ''}
                </small>
              </div>
            ))}
          </div>
        ) : (
          <p className="inline-note" style={{ marginTop: '0.7rem' }}>
            Nenhum impedimento listado para as condicoes informadas.
          </p>
        )}
      </div>

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
