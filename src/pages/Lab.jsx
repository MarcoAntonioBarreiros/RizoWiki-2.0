import ViabilityChart from '../components/ViabilityChart.jsx';
import { simulateViability } from '../engines/viabilityEngine.js';

const demoPrior = {
  ideal_temp_c: 30,
  decay_k_base_per_h: 0.02,
  uv_sensitivity: 0.3,
  effective_threshold_log: 7,
  chemical_sensitivity_by_class: {
    nenhum: 1,
    fungicida: 1.4,
  },
};

export default function Lab() {
  const result = simulateViability({
    initialLog: 9,
    hours: 24,
    temperatureC: 30,
    chemicalClass: 'fungicida',
    exposedToUv: false,
    organism: demoPrior,
  });

  return (
    <section>
      <h2 className="page__title">Lab - viabilidade no tempo</h2>
      <p className="page__todo">
        Demonstracao da Fase 2 com priors ilustrativos, nao calibrados e pendentes de revisao.
      </p>
      <ViabilityChart curve={result.curve} threshold={result.threshold} />
      <p className="page__todo">
        Veredito: <strong>{result.verdict}</strong> | Confianca: <strong>{result.confidence}</strong>
      </p>
      <ul className="page__todo">
        {result.limitations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
