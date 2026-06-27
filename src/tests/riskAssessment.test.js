import { describe, expect, it } from 'vitest';
import { assessApplication } from '../utils/riskAssessment.js';

describe('riskAssessment (Fatores) por limites operacionais com fonte', () => {
  it('incompatibilidade DURA => no-go com fonte (trichoderma + fungicida)', () => {
    const r = assessApplication({ organismo: 'trichoderma', quimico: 'fungicida', modo: 'mistura_tanque' });
    expect(r.semaphore).toBe('nogo');
    const hard = r.flags.find((f) => f.nivel === 'nogo');
    expect(hard).toBeTruthy();
    expect(hard.fonte).toBeTruthy();
  });

  it('fonte BRANDA => risco (atencao), nao bloqueio (pnsb + cloro)', () => {
    const r = assessApplication({ organismo: 'pnsb', quimico: 'cloro', modo: 'mistura_tanque' });
    expect(r.semaphore).toBe('atencao');
    expect(r.flags.some((f) => f.nivel === 'nogo')).toBe(false);
  });

  it('janela de 24h excedida => atencao com acao reinocular (nao bloqueio)', () => {
    const r = assessApplication({ organismo: 'pseudomonas', horas: 48, quimico: 'nenhum' });
    expect(r.semaphore).toBe('atencao');
    expect(r.flags.some((f) => /reinocular/i.test(f.acao))).toBe(true);
  });

  it('UV: methylobacterium (pigmento) nao gera flag; pseudomonas gera', () => {
    const methylo = assessApplication({ organismo: 'methylobacterium', exposicaoUV: true, quimico: 'nenhum' });
    const pseudo = assessApplication({ organismo: 'pseudomonas', exposicaoUV: true, quimico: 'nenhum', horas: 1, refrigerado: true });
    expect(methylo.flags.some((f) => /uv|sol/i.test(f.mensagem))).toBe(false);
    expect(pseudo.flags.some((f) => /uv|sol/i.test(f.mensagem))).toBe(true);
  });

  it('cenario tranquilo => go; bacillus resiliente aparece nas limitacoes', () => {
    const r = assessApplication({
      organismo: 'bacillus',
      horas: 2,
      refrigerado: true,
      exposicaoUV: false,
      quimico: 'nenhum',
      umidade: 'adequado',
    });
    expect(r.semaphore).toBe('go');
    expect(r.limitations.join(' ').toLowerCase()).toContain('resiliente');
  });

  it('solo seco => atencao com acao de umidade', () => {
    const r = assessApplication({ organismo: 'bacillus', horas: 1, refrigerado: true, quimico: 'nenhum', umidade: 'seco' });
    expect(r.semaphore).toBe('atencao');
    expect(r.flags.some((f) => /umido/i.test(f.acao))).toBe(true);
  });

  it('organismo sem limites => inconclusiva', () => {
    const r = assessApplication({ organismo: 'desconhecido', quimico: 'nenhum' });
    expect(r.confidence).toBe('inconclusiva');
  });
});
