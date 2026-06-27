import { useMemo } from 'react';
import ViabilityChart from '../components/ViabilityChart.jsx';
import { simulateViability } from '../engines/viabilityEngine.js';
import organismsData from '../data/organisms.json';

const CHEMICAL_CLASSES = [
  { value: 'nenhum', label: 'Nenhum' },
  { value: 'fungicida', label: 'Fungicida' },
  { value: 'cuprico_metal', label: 'Cuprico / metal' },
  { value: 'adubo_salino', label: 'Adubo salino' },
  { value: 'herbicida', label: 'Herbicida' },
];

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return Number(value).toFixed(digits);
}

export default function Lab({ caseState, onCaseChange }) {
  const organisms = organismsData.organisms;
  const organismIds = Object.keys(organisms);
  const organismId = organisms[caseState.organismo] ? caseState.organismo : organismIds[0];
  const initialLog = caseState.initialLog;
  const hours = caseState.horas;
  const temperatureC = caseState.temperatureC;
  const chemicalClass = caseState.quimico;
  const exposedToUv = caseState.exposicaoUV;
  const threshold = caseState.effectiveThresholdLog ?? organisms[organismId].viability.effective_threshold_log;

  const organism = organisms[organismId].viability;

  const result = useMemo(
    () =>
      simulateViability({
        initialLog,
        hours,
        temperatureC,
        chemicalClass,
        exposedToUv,
        effectiveThresholdLog: threshold,
        organism,
      }),
    [chemicalClass, exposedToUv, hours, initialLog, organism, temperatureC, threshold],
  );

  function handleOrganismChange(nextId) {
    onCaseChange('organismo', nextId);
  }

  return (
    <section>
      <h2 className="page__title">Lab - viabilidade no tempo</h2>
      <p className="page__todo">
        COMPARADOR ILUSTRATIVO (nao calibrado): curva de decaimento de 1a ordem com priors
        demonstrativos. Serve so para comparar cenarios - NAO decide viabilidade. A decisao de
        "posso aplicar agora?" esta na aba Fatores (limites operacionais com fonte).
      </p>

      <div className="lab-grid">
        <label className="field">
          <span>Organismo</span>
          <select value={organismId} onChange={(event) => handleOrganismChange(event.target.value)}>
            {organismIds.map((id) => (
              <option key={id} value={id}>{organisms[id].label}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Log inicial UFC</span>
          <input type="number" min="5" max="12" step="0.1" value={initialLog} onChange={(event) => onCaseChange('initialLog', Number(event.target.value))} />
        </label>

        <label className="field">
          <span>Horas de contato</span>
          <input type="number" min="0" max="168" step="1" value={hours} onChange={(event) => onCaseChange('horas', Number(event.target.value))} />
        </label>

        <label className="field">
          <span>Temperatura C</span>
          <input type="number" min="0" max="50" step="1" value={temperatureC} onChange={(event) => onCaseChange('temperatureC', Number(event.target.value))} />
        </label>

        <label className="field">
          <span>Classe quimica</span>
          <select value={chemicalClass} onChange={(event) => onCaseChange('quimico', event.target.value)}>
            {CHEMICAL_CLASSES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Limiar efetivo log</span>
          <input type="number" min="4" max="10" step="0.1" value={threshold} onChange={(event) => onCaseChange('effectiveThresholdLog', Number(event.target.value))} />
        </label>

        <label className="check-field">
          <input type="checkbox" checked={exposedToUv} onChange={(event) => onCaseChange('exposicaoUV', event.target.checked)} />
          <span>Exposicao a UV/foliar</span>
        </label>
      </div>

      <ViabilityChart curve={result.curve} threshold={result.threshold} />

      <div className="metric-grid">
        <div><span>Log final</span><strong>{formatNumber(result.finalLog)}</strong></div>
        <div><span>Sobrevivencia relativa</span><strong>{formatNumber((result.relativeSurvival ?? 0) * 100, 1)}%</strong></div>
        <div><span>k total</span><strong>{formatNumber(result.kTotal, 4)}</strong></div>
        <div><span>Veredito</span><strong>{result.verdict}</strong></div>
      </div>

      <ul className="page__todo">
        {result.limitations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
