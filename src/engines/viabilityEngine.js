const LN_10 = Math.log(10);

function numberOrNull(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function temperatureFactor({ temperatureC, idealTempC, q10 = 2.5, coldSlopePerC = 0.03 }) {
  const temperature = numberOrNull(temperatureC);
  const ideal = numberOrNull(idealTempC);
  if (temperature === null || ideal === null) return null;

  if (temperature > ideal) {
    return q10 ** ((temperature - ideal) / 10);
  }

  return clamp(1 - (ideal - temperature) * coldSlopePerC, 0.25, 1);
}

export function uvFactor({ exposedToUv = false, uvSensitivity = 0 }) {
  if (!exposedToUv) return 1;
  const sensitivity = numberOrNull(uvSensitivity);
  if (sensitivity === null) return null;
  return 1 + sensitivity;
}

export function chemicalFactor({ chemicalClass = 'nenhum', chemicalSensitivityByClass = {} }) {
  if (chemicalClass === 'nenhum') return 1;
  const factor = numberOrNull(chemicalSensitivityByClass[chemicalClass]);
  return factor;
}

function collectMissing(input) {
  const missing = [];
  if (numberOrNull(input.initialLog) === null) missing.push('initialLog');
  if (numberOrNull(input.hours) === null) missing.push('hours');
  if (numberOrNull(input.temperatureC) === null) missing.push('temperatureC');
  if (numberOrNull(input.organism?.ideal_temp_c) === null) missing.push('organism.ideal_temp_c');
  if (numberOrNull(input.organism?.decay_k_base_per_h) === null) missing.push('organism.decay_k_base_per_h');
  if (input.chemicalClass && input.chemicalClass !== 'nenhum' && chemicalFactor({ chemicalClass: input.chemicalClass, chemicalSensitivityByClass: input.organism?.chemical_sensitivity_by_class }) === null) {
    missing.push(`organism.chemical_sensitivity_by_class.${input.chemicalClass}`);
  }
  if (input.exposedToUv && numberOrNull(input.organism?.uv_sensitivity) === null) missing.push('organism.uv_sensitivity');
  return missing;
}

export function simulateViability(input = {}) {
  const missing = collectMissing(input);
  if (missing.length > 0) {
    return {
      curve: [],
      finalLog: null,
      relativeSurvival: null,
      verdict: 'inconclusivo',
      confidence: 'inconclusiva',
      limitations: [
        `Dados ausentes: ${missing.join(', ')}.`,
        'Modelo ilustrativo, nao calibrado; constantes devem ser priors revisados por Marco.',
      ],
    };
  }

  const initialLog = Number(input.initialLog);
  const hours = Math.max(0, Number(input.hours));
  const organism = input.organism;
  const kBase = Number(organism.decay_k_base_per_h);
  const fT = temperatureFactor({
    temperatureC: input.temperatureC,
    idealTempC: organism.ideal_temp_c,
    q10: input.q10 ?? 2.5,
    coldSlopePerC: input.coldSlopePerC ?? 0.03,
  });
  const fC = chemicalFactor({
    chemicalClass: input.chemicalClass ?? 'nenhum',
    chemicalSensitivityByClass: organism.chemical_sensitivity_by_class,
  });
  const fUv = uvFactor({
    exposedToUv: input.exposedToUv ?? false,
    uvSensitivity: organism.uv_sensitivity ?? 0,
  });

  const kTotal = kBase * fT * fC * fUv;
  const pointCount = Math.max(2, Math.min(49, Number(input.pointCount ?? 25)));
  const step = hours / (pointCount - 1);
  const curve = Array.from({ length: pointCount }, (_, index) => {
    const t = index * step;
    return {
      t,
      log10N: initialLog - (kTotal * t) / LN_10,
    };
  });

  const finalLog = curve[curve.length - 1].log10N;
  const relativeSurvival = 10 ** (finalLog - initialLog);
  const threshold = numberOrNull(input.effectiveThresholdLog ?? organism.effective_threshold_log);
  const verdict = threshold === null ? 'sem_limiar' : finalLog >= threshold ? 'acima_limiar' : 'abaixo_limiar';

  return {
    curve,
    finalLog,
    relativeSurvival,
    verdict,
    kTotal,
    factors: { temperature: fT, chemical: fC, uv: fUv },
    threshold,
    confidence: threshold === null ? 'baixa' : 'media',
    limitations: [
      'Modelo ilustrativo, nao calibrado; ranqueia cenarios, nao preve numero de campo.',
      'Constantes devem permanecer como priors configuraveis ate revisao tecnica.',
    ],
  };
}

export default simulateViability;
