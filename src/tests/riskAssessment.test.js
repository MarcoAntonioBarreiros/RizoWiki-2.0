import { describe, expect, it } from 'vitest';
import { assessApplication } from '../utils/riskAssessment.js';

describe('riskAssessment (Fatores) reusa os motores', () => {
  it('cenario tranquilo => go', () => {
    const r = assessApplication({
      organismo: 'bacillus',
      horas: 2,
      refrigerado: true,
      exposicaoUV: false,
      quimico: 'nenhum',
      umidade: 'adequado',
    });
    expect(r.semaphore).toBe('go');
    expect(r.confidence).toBe('baixa');
  });

  it('tank-mix proibido (trichoderma + fungicida) => no-go via compatibilityEngine', () => {
    const r = assessApplication({
      organismo: 'trichoderma',
      quimico: 'fungicida',
      modo: 'mistura_tanque',
      horas: 1,
      refrigerado: true,
    });
    expect(r.semaphore).toBe('nogo');
    expect(r.flags.some((f) => f.nivel === 'nogo')).toBe(true);
  });

  it('tempo/UV longos => no-go via viabilityEngine (abaixo do limiar)', () => {
    const r = assessApplication({
      organismo: 'trichoderma',
      horas: 72,
      refrigerado: false,
      exposicaoUV: true,
      quimico: 'nenhum',
      umidade: 'adequado',
    });
    expect(r.viability.verdict).toBe('abaixo_limiar');
    expect(r.semaphore).toBe('nogo');
  });

  it('solo seco => atencao com acao corretiva', () => {
    const r = assessApplication({
      organismo: 'bacillus',
      horas: 1,
      refrigerado: true,
      quimico: 'nenhum',
      umidade: 'seco',
    });
    expect(r.semaphore).toBe('atencao');
    expect(r.flags.some((f) => /umido/i.test(f.acao))).toBe(true);
  });

  it('organismo sem prior => inconclusiva e nao avalia viabilidade', () => {
    const r = assessApplication({ organismo: 'desconhecido', quimico: 'nenhum' });
    expect(r.confidence).toBe('inconclusiva');
    expect(r.viability).toBeNull();
  });
});
