// Mapa - diagnostico rapido -> recomendacao justificada (brief secao 6).
// A pagina orquestra motores e componentes visuais; as decisoes ficam nos engines.
import { useEffect, useMemo } from 'react';
import QuickDiagnosisForm from '../components/QuickDiagnosisForm.jsx';
import SoilAnalysisForm from '../components/SoilAnalysisForm.jsx';
import SoilSummaryPanel from '../components/SoilSummaryPanel.jsx';
import ConfidenceBadge from '../components/ConfidenceBadge.jsx';
import RecommendationCard from '../components/RecommendationCard.jsx';
import { evaluateCompatibility } from '../engines/compatibilityEngine.js';
import { buildProtocol } from '../engines/protocolEngine.js';
import { buildMapRecommendations } from '../engines/recommendationEngine.js';
import { buildSoilSummary } from '../engines/soil/soilSummary.js';
import ProtocolReport from '../components/ProtocolReport.jsx';
import { DISCLAIMER } from '../disclaimer.js';

const SEMAPHORE_COLOR = { verde: '#22c55e', amarelo: '#fbbf24', vermelho: '#ef4444' };

function AlertBox({ children, tone = 'warn' }) {
  if (!children) return null;
  return <div className={`alert-box alert-box--${tone}`}>{children}</div>;
}

function CompatibilityPanel({ compat, quimico, modo }) {
  if (!compat) return null;

  return (
    <div className="map-panel">
      <div className="map-panel__header">
        <div>
          <h3>Compatibilidade</h3>
          <p>{quimico} / {modo}</p>
        </div>
      </div>
      <div className="compat-grid">
        {compat.results.map((res) => (
          <div key={res.organism + res.chemical_class} className="compat-item">
            <span
              aria-hidden="true"
              style={{ background: SEMAPHORE_COLOR[res.semaphore] || 'var(--muted)' }}
            />
            <strong>{res.organism}</strong>
            <p>{res.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LimitationsPanel({ limitations }) {
  if (!limitations || limitations.length === 0) return null;

  return (
    <details className="map-details">
      <summary>Limites e premissas do modelo</summary>
      <ul>
        {limitations.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </details>
  );
}

export default function Mapa({ caseState, onCaseChange }) {
  const form = caseState;
  const onChange = onCaseChange;

  const soilSummary = useMemo(() => buildSoilSummary(form), [form]);
  const { soil, pInterp, acidez, compactacao } = soilSummary;
  const pClasseParaDiagnostico = pInterp.origem === 'real' ? soilSummary.pClasse : undefined;

  const soilBaseLimitante = useMemo(() => {
    const tipos = [];
    if (acidez.acidez_limitante && acidez.origem === 'real') tipos.push('acidez');
    if (compactacao.compactado && compactacao.restricao === 'severa' && compactacao.origem === 'real') {
      tipos.push('compactacao');
    }
    return tipos.length ? { tipos } : null;
  }, [acidez, compactacao]);

  const mapa = useMemo(
    () => buildMapRecommendations({ ...form, pClasse: pClasseParaDiagnostico, soilBaseLimitante }),
    [form, pClasseParaDiagnostico, soilBaseLimitante],
  );
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
    <section className="map-page">
      <div className="map-hero">
        <div>
          <p className="map-kicker">Mapa de decisao</p>
          <h2 className="page__title">Diagnostico rapido</h2>
          <p>{diag.message}</p>
        </div>
        <div className="map-hero__status">
          <span>Confianca do diagnostico</span>
          <ConfidenceBadge level={diag.confidence} />
          <strong>{soil.campos_reais}/{soil.campos_total}</strong>
          <small>campos reais de solo</small>
        </div>
      </div>

      <div className="map-panel">
        <div className="map-panel__header">
          <div>
            <h3>Caso</h3>
            <p>Cultura, problema e manejo informados</p>
          </div>
        </div>
        <QuickDiagnosisForm value={form} onChange={onChange} />
      </div>

      <div className="map-panel">
        <div className="map-panel__header">
          <div>
            <h3>Analise de solo</h3>
            <p>Campos vazios entram como prior regional rotulado</p>
          </div>
        </div>
        <SoilAnalysisForm value={form.soil || {}} onChange={(field, val) => onChange('soil.' + field, val)} />
      </div>

      <SoilSummaryPanel soilSummary={soilSummary} />

      <AlertBox>
        {pInterp.origem === 'real'
          ? 'A classe de P real esta alimentando o diagnostico e o ranking.'
          : 'Informe P e argila reais para que o fosforo deixe de ser prior e passe a influenciar o ranking.'}
      </AlertBox>

      {diag.bioinsumoEhAlavancaPrincipal === false && (
        <AlertBox>
          Bioinsumo nao e a alavanca principal neste cenario; corrija a limitacao de base antes de tratar como recomendacao principal.
        </AlertBox>
      )}

      <div className="map-panel">
        <div className="map-panel__header">
          <div>
            <h3>Ranking de organismos</h3>
            <p>
              {ranked.length > 0
                ? `${ranked.length} candidatos avaliados por problema, manejo, compatibilidade e solo`
                : 'Nenhum candidato tecnico para este caso'}
            </p>
          </div>
        </div>

        {diag.funcoesPrioritarias.length > 0 && (
          <div className="priority-strip">
            {diag.funcoesPrioritarias.map((fn) => (
              <span key={fn}>{fn}</span>
            ))}
          </div>
        )}

        {ranked.length > 0 ? (
          <div className="recommendation-list">
            {ranked.map((item, idx) => (
              <RecommendationCard
                key={item.organism}
                item={item}
                index={idx}
                isTop={item.organism === recomendado}
                onSelect={(organism) => onCaseChange('organismo', organism)}
              />
            ))}
          </div>
        ) : (
          <p className="inline-note">O diagnostico atual aponta uma correcao de base ou falta de candidato curado.</p>
        )}
      </div>

      <CompatibilityPanel compat={compat} quimico={form.quimico} modo={form.modo} />

      {candidatos.length > 0 && (
        <div className="map-panel">
          <div className="map-panel__header">
            <div>
              <h3>Ficha pratica</h3>
              <p>Organismo selecionado para protocolo</p>
            </div>
            <label className="field compact-field">
              <span>Organismo</span>
              <select value={escolhido} onChange={(event) => onCaseChange('organismo', event.target.value)}>
                {ranked.map((item) => (
                  <option key={item.organism} value={item.organism}>
                    {item.label} - score {item.score}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ProtocolReport
            protocol={protocolo}
            contexto={{ cultura: form.cultura, problema: form.problema, quimico: form.quimico, modo: form.modo }}
          />
        </div>
      )}

      <LimitationsPanel limitations={limitations} />

      <p className="map-disclaimer">{DISCLAIMER}</p>
    </section>
  );
}
