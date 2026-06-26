// Mapa - diagnostico rapido -> recomendacao justificada (brief secao 6).
// Reusa diagnosticEngine + compatibilityEngine (AGENTS.md regra 6: nao duplica logica).
// A pagina so orquestra e exibe; toda decisao vive nos motores.
import { useMemo, useState } from 'react';
import QuickDiagnosisForm from '../components/QuickDiagnosisForm.jsx';
import ConfidenceBadge from '../components/ConfidenceBadge.jsx';
import { runDiagnosis } from '../engines/diagnosticEngine.js';
import { evaluateCompatibility } from '../engines/compatibilityEngine.js';

const SEMAPHORE_COLOR = { verde: '#22c55e', amarelo: '#fbbf24', vermelho: '#ef4444' };

const INITIAL = {
  cultura: 'soja',
  estadio: 'pre_semeadura',
  problema: 'fosforo_indisponivel',
  pClasse: 'medio',
  umidade: 'adequado',
  quimico: 'nenhum',
  modo: 'tratamento_semente',
};

export default function Mapa() {
  const [form, setForm] = useState(INITIAL);
  const onChange = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const diag = useMemo(() => runDiagnosis(form), [form]);

  const compat = useMemo(() => {
    if (form.quimico === 'nenhum' || diag.organismosCandidatos.length === 0) return null;
    return evaluateCompatibility({
      organisms: diag.organismosCandidatos,
      chemicalClasses: [form.quimico],
      applicationMode: form.modo,
    });
  }, [form, diag]);

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

      <p style={{ marginTop: '1rem' }}>
        <ConfidenceBadge level={diag.confidence} />
      </p>

      <ul className="page__todo">
        {limitations.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>

      <p className="page__todo">
        Proximos blocos (Fase 4): protocolo pratico (protocolEngine) e ficha exportavel.
      </p>
    </section>
  );
}
