// Mapa - diagnostico rapido -> recomendacao justificada (brief secao 6).
// Reusa diagnosticEngine + compatibilityEngine (AGENTS.md regra 6: nao duplica logica).
// A pagina so orquestra e exibe; toda decisao vive nos motores.
import { useEffect, useMemo } from 'react';
import QuickDiagnosisForm from '../components/QuickDiagnosisForm.jsx';
import ConfidenceBadge from '../components/ConfidenceBadge.jsx';
import { evaluateCompatibility } from '../engines/compatibilityEngine.js';
import { buildProtocol } from '../engines/protocolEngine.js';
import { buildMapRecommendations } from '../engines/recommendationEngine.js';
import ProtocolReport from '../components/ProtocolReport.jsx';
import { DISCLAIMER } from '../disclaimer.js';

const SEMAPHORE_COLOR = { verde: '#22c55e', amarelo: '#fbbf24', vermelho: '#ef4444' };
const RISK_COLOR = { go: '#22c55e', atencao: '#fbbf24', nogo: '#ef4444' };
const STATUS_LABEL = {
  recomendado: 'Recomendado para este caso',
  ajustar: 'Usar com ajustes',
  evitar_agora: 'Evitar agora / revisar',
};

export default function Mapa({ caseState, onCaseChange }) {
  const form = caseState;
  const onChange = onCaseChange;

  const mapa = useMemo(() => buildMapRecommendations(form), [form]);
  const diag = mapa.diagnosis;
  const ranked = mapa.rankedRecommendations;

  const compat = useMemo(() => {
    if (form.quimico === 'nenhum' || diag.organismosCandidatos.length === 0) return null;
    return evaluateCompatibility({
      organisms: diag.organismosCandidatos,
      chemicalClasses: [form.quimico],
      applicationMode: form.modo,
    });
  }, [form, diag]);

  const candidatos = ranked.map((item) => item.organism);
  const recomendado = mapa.topRecommendation?.organism;
  const escolhido = candidatos.includes(form.organismo) ? form.organismo : recomendado;

  useEffect(() => {
    if (candidatos.length > 0 && !candidatos.includes(form.organismo)) {
      onCaseChange('organismo', candidatos[0]);
    }
  }, [candidatos, form.organismo, onCaseChange]);

  const protocolo = useMemo(() => {
    if (!escolhido) return null;
    return buildProtocol({
      organismo: escolhido,
      cultura: form.cultura,
      quimico: form.quimico,
      modo: form.modo,
      bioinsumoEhAlavancaPrincipal: diag.bioinsumoEhAlavancaPrincipal,
    });
  }, [escolhido, form, diag]);

  const limitations = [...mapa.limitations, ...(compat ? compat.limitations : [])];

  return (
    <section>
      <h2 className="page__title">Mapa - diagnostico rapido</h2>
      <p className="page__todo">
        Diagnostico por regras explicaveis (rascunho) + checagem de compatibilidade.
        Reusa diagnosticEngine e compatibilityEngine; nada de prescricao automatica.
      </p>

      <QuickDiagnosisForm value={form} onChange={onChange} />

      <h3>Diagnostico</h3>
      <p>{diag.message}</p>

      {diag.bioinsumoEhAlavancaPrincipal === false && (
        <p
          style={{
            border: '1px solid var(--warn)',
            background: 'rgba(251, 191, 36, 0.12)',
            borderRadius: 8,
            padding: '0.6rem 0.8rem',
          }}
        >
          Atencao: bioinsumo nao e a alavanca principal neste cenario.
        </p>
      )}

      {diag.funcoesPrioritarias.length > 0 && (
        <p>
          <strong>Funcoes prioritarias:</strong> {diag.funcoesPrioritarias.join(', ')}
        </p>
      )}

      {diag.organismosCandidatos.length > 0 && (
        <p>
          <strong>Organismos candidatos ranqueados:</strong>{' '}
          {ranked.map((item) => `${item.organism} (${item.score})`).join(', ')}
        </p>
      )}

      {ranked.length > 0 && (
        <>
          <h3>Recomendacao ranqueada</h3>
          <div style={{ display: 'grid', gap: '0.75rem', margin: '0.75rem 0 1rem' }}>
            {ranked.map((item, idx) => (
              <article
                key={item.organism}
                style={{
                  border: '1px solid var(--panel-2)',
                  borderLeft: `6px solid ${RISK_COLOR[item.riskSemaphore] || 'var(--panel-2)'}`,
                  borderRadius: 8,
                  padding: '0.75rem 0.85rem',
                  background: idx === 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 23, 42, 0.42)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong>{idx + 1}. {item.label}</strong>
                  <span style={{ color: 'var(--muted)', fontSize: '0.86rem' }}>
                    escore {item.score} - {STATUS_LABEL[item.status]}
                  </span>
                  {item.organism === recomendado && (
                    <span style={{ color: 'var(--accent)', fontSize: '0.82rem' }}>melhor ajuste</span>
                  )}
                </div>

                {item.reasons.length > 0 && (
                  <ul className="page__todo" style={{ marginTop: '0.45rem' }}>
                    {item.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}

                {item.alerts.length > 0 && (
                  <ul style={{ margin: '0.45rem 0 0', color: RISK_COLOR[item.riskSemaphore] || 'var(--warn)' }}>
                    {item.alerts.map((alert) => (
                      <li key={alert}>{alert}</li>
                    ))}
                  </ul>
                )}

                {item.actions.length > 0 && (
                  <ul className="page__todo" style={{ marginTop: '0.45rem' }}>
                    {item.actions.map((action) => (
                      <li key={action}>Acao: {action}</li>
                    ))}
                  </ul>
                )}

                <button
                  className="app__tab"
                  style={{ marginTop: '0.45rem' }}
                  onClick={() => onCaseChange('organismo', item.organism)}
                >
                  Usar na ficha
                </button>
              </article>
            ))}
          </div>
        </>
      )}

      {compat && (
        <>
          <h3>
            Compatibilidade com {form.quimico} ({form.modo})
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {compat.results.map((res) => (
              <li key={res.organism + res.chemical_class} style={{ margin: '0.4rem 0' }}>
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: SEMAPHORE_COLOR[res.semaphore] || 'var(--muted)',
                    marginRight: 8,
                  }}
                />
                <strong>{res.organism}</strong>: {res.message}
              </li>
            ))}
          </ul>
        </>
      )}

      {candidatos.length > 0 && (
        <>
          <h3>Protocolo pratico</h3>
          <label className="field" style={{ maxWidth: 280 }}>
            <span>Organismo escolhido para ficha</span>
            <select value={escolhido} onChange={(event) => onCaseChange('organismo', event.target.value)}>
              {ranked.map((item) => (
                <option key={item.organism} value={item.organism}>
                  {item.label} - escore {item.score}
                </option>
              ))}
            </select>
          </label>
          <ProtocolReport
            protocol={protocolo}
            contexto={{ cultura: form.cultura, problema: form.problema, quimico: form.quimico, modo: form.modo }}
          />
        </>
      )}

      <p style={{ marginTop: '1rem' }}>
        <ConfidenceBadge level={diag.confidence} />
      </p>

      <ul className="page__todo">
        {limitations.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>

      <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{DISCLAIMER}</p>

      <p className="page__todo">
        O organismo, quimico, umidade e modo selecionados aqui alimentam tambem Fatores e Lab.
        No Mapa V0.5, esses campos tambem rebaixam ou bloqueiam candidatos no ranking acima.
      </p>
    </section>
  );
}
