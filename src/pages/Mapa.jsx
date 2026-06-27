// Mapa - diagnostico rapido -> recomendacao justificada (brief secao 6).
// Reusa diagnosticEngine + compatibilityEngine (AGENTS.md regra 6: nao duplica logica).
// A pagina so orquestra e exibe; toda decisao vive nos motores.
import { useEffect, useMemo } from 'react';
import QuickDiagnosisForm from '../components/QuickDiagnosisForm.jsx';
import ConfidenceBadge from '../components/ConfidenceBadge.jsx';
import { runDiagnosis } from '../engines/diagnosticEngine.js';
import { evaluateCompatibility } from '../engines/compatibilityEngine.js';
import { buildProtocol } from '../engines/protocolEngine.js';
import ProtocolReport from '../components/ProtocolReport.jsx';
import { DISCLAIMER } from '../disclaimer.js';

const SEMAPHORE_COLOR = { verde: '#22c55e', amarelo: '#fbbf24', vermelho: '#ef4444' };

export default function Mapa({ caseState, onCaseChange }) {
  const form = caseState;
  const onChange = onCaseChange;

  const diag = useMemo(() => runDiagnosis(form), [form]);

  const compat = useMemo(() => {
    if (form.quimico === 'nenhum' || diag.organismosCandidatos.length === 0) return null;
    return evaluateCompatibility({
      organisms: diag.organismosCandidatos,
      chemicalClasses: [form.quimico],
      applicationMode: form.modo,
    });
  }, [form, diag]);

  const candidatos = diag.organismosCandidatos;
  const escolhido = candidatos.includes(form.organismo) ? form.organismo : candidatos[0];

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

  const limitations = [...diag.limitations, ...(compat ? compat.limitations : [])];

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
          <strong>Organismos candidatos (rascunho):</strong>{' '}
          {diag.organismosCandidatos.join(', ')}
        </p>
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
            <span>Organismo escolhido</span>
            <select value={escolhido} onChange={(event) => onCaseChange('organismo', event.target.value)}>
              {candidatos.map((id) => (
                <option key={id} value={id}>{id}</option>
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
      </p>
    </section>
  );
}
