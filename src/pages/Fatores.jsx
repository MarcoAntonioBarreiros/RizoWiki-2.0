// Fatores - checklist go/no-go "vou aplicar agora?" (brief secao 6).
// A pagina orquestra: RiskPanel coleta, riskAssessment reusa os motores e decide.
import { useMemo } from 'react';
import RiskPanel from '../components/RiskPanel.jsx';
import ConfidenceBadge from '../components/ConfidenceBadge.jsx';
import { assessApplication } from '../utils/riskAssessment.js';
import { DISCLAIMER } from '../disclaimer.js';

const VERDICT = {
  go: { label: 'GO - pode aplicar', color: '#22c55e' },
  atencao: { label: 'ATENCAO - ajustar antes', color: '#fbbf24' },
  nogo: { label: 'NO-GO - nao aplicar agora', color: '#ef4444' },
};

export default function Fatores({ caseState, onCaseChange }) {
  const form = caseState;
  const onChange = onCaseChange;
  const result = useMemo(() => assessApplication(form), [form]);
  const verdict = VERDICT[result.semaphore] ?? VERDICT.atencao;

  return (
    <section>
      <h2 className="page__title">Fatores - vou aplicar agora?</h2>
      <p className="page__todo">
        Checklist pre-aplicacao. Reusa viabilityEngine e compatibilityEngine (via
        riskAssessment); usa o mesmo caso selecionado no Mapa e no Lab.
      </p>

      <RiskPanel value={form} onChange={onChange} />

      <div
        style={{
          border: `1px solid ${verdict.color}`,
          borderLeft: `6px solid ${verdict.color}`,
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: 8,
          padding: '0.7rem 0.9rem',
          margin: '1rem 0',
        }}
      >
        <strong style={{ color: verdict.color }}>{verdict.label}</strong>
      </div>

      {result.flags.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {result.flags.map((flag, idx) => (
            <li key={idx} style={{ margin: '0.45rem 0' }}>
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: flag.nivel === 'nogo' ? '#ef4444' : '#fbbf24',
                  marginRight: 8,
                }}
              />
              <strong>{flag.mensagem}</strong>
              <div style={{ color: 'var(--muted)', marginLeft: 18, fontSize: '0.9rem' }}>
                Acao: {flag.acao}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="page__todo">Nenhum impedimento listado para as condicoes informadas.</p>
      )}

      <p style={{ marginTop: '0.5rem' }}>
        <ConfidenceBadge level={result.confidence} />
      </p>
      <ul className="page__todo">
        {result.limitations.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
      <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{DISCLAIMER}</p>
    </section>
  );
}
