import { describe, expect, it } from 'vitest';
import { simulateViability, temperatureFactor } from '../engines/viabilityEngine.js';

const bacillusPrior = {
  ideal_temp_c: 30,
  decay_k_base_per_h: 0.02,
  uv_sensitivity: 0.3,
  effective_threshold_log: 7,
  chemical_sensitivity_by_class: {
    nenhum: 1,
    fungicida: 1.4,
  },
};

describe('viabilityEngine', () => {
  it('usa fator de temperatura assimetrico: calor penaliza mais que frio moderado', () => {
    const hot = temperatureFactor({ temperatureC: 40, idealTempC: 30, q10: 2.5 });
    const cool = temperatureFactor({ temperatureC: 20, idealTempC: 30, q10: 2.5 });

    expect(hot).toBeGreaterThan(1);
    expect(cool).toBeLessThanOrEqual(1);
    expect(cool).toBeGreaterThan(0.25);
  });

  it('calcula curva de primeira ordem e reduz log final com o tempo', () => {
    const result = simulateViability({
      initialLog: 9,
      hours: 24,
      temperatureC: 30,
      chemicalClass: 'nenhum',
      organism: bacillusPrior,
      pointCount: 5,
    });

    expect(result.curve).toHaveLength(5);
    expect(result.curve[0].log10N).toBeCloseTo(9);
    expect(result.finalLog).toBeLessThan(9);
    expect(result.relativeSurvival).toBeLessThan(1);
    expect(result.verdict).toBe('acima_limiar');
    expect(result.confidence).toBe('baixa');
  });

  it('penaliza quimico e UV quando informados', () => {
    const base = simulateViability({
      initialLog: 9,
      hours: 24,
      temperatureC: 30,
      chemicalClass: 'nenhum',
      organism: bacillusPrior,
    });
    const stressed = simulateViability({
      initialLog: 9,
      hours: 24,
      temperatureC: 30,
      chemicalClass: 'fungicida',
      exposedToUv: true,
      organism: bacillusPrior,
    });

    expect(stressed.kTotal).toBeGreaterThan(base.kTotal);
    expect(stressed.finalLog).toBeLessThan(base.finalLog);
  });

  it('aceita limiar efetivo configuravel por entrada', () => {
    const result = simulateViability({
      initialLog: 7.1,
      hours: 48,
      temperatureC: 35,
      chemicalClass: 'fungicida',
      organism: bacillusPrior,
      effectiveThresholdLog: 7,
    });

    expect(result.threshold).toBe(7);
    expect(result.verdict).toBe('abaixo_limiar');
  });

  it('retorna inconclusivo quando faltam constantes', () => {
    const result = simulateViability({
      initialLog: 9,
      hours: 12,
      temperatureC: 30,
      chemicalClass: 'fungicida',
      organism: { ideal_temp_c: 30 },
    });

    expect(result.confidence).toBe('inconclusiva');
    expect(result.verdict).toBe('inconclusivo');
    expect(result.limitations.join(' ')).toContain('decay_k_base_per_h');
  });
});
