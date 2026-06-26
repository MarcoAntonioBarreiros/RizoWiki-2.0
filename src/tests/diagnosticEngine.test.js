import { describe, expect, it } from 'vitest';
import { runDiagnosis, classificaCultura, PROBLEMAS } from '../engines/diagnosticEngine.js';

describe('diagnosticEngine (versao leve por regras)', () => {
  it('fosforo indisponivel prioriza solubilizacao de P e sugere micorrizas', () => {
    const r = runDiagnosis({
      cultura: 'milho',
      problema: 'fosforo_indisponivel',
      pClasse: 'medio',
      umidade: 'adequado',
    });
    expect(r.funcoesPrioritarias).toContain('solubilizacao_p');
    expect(r.organismosCandidatos).toContain('micorrizas');
    expect(r.bioinsumoEhAlavancaPrincipal).toBe(true);
    expect(r.confidence).toBe('baixa');
  });

  it('honestidade agronomica: acidez/fertilidade nao tem bioinsumo como alavanca', () => {
    const r = runDiagnosis({ cultura: 'soja', problema: 'acidez_fertilidade' });
    expect(r.bioinsumoEhAlavancaPrincipal).toBe(false);
    expect(r.message.toLowerCase()).toContain('nao e a alavanca principal');
    expect(r.organismosCandidatos).toHaveLength(0);
  });

  it('doenca de solo prioriza biocontrole e sugere trichoderma', () => {
    const r = runDiagnosis({ problema: 'doenca_solo' });
    expect(r.funcoesPrioritarias).toContain('biocontrole');
    expect(r.organismosCandidatos).toContain('trichoderma');
  });

  it('fixacao de N: leguminosa puxa rhizobium; graminea puxa fixadores', () => {
    const soja = runDiagnosis({ cultura: 'soja', problema: 'baixa_fixacao_n' });
    const milho = runDiagnosis({ cultura: 'milho', problema: 'baixa_fixacao_n' });
    expect(soja.organismosCandidatos).toEqual(['rhizobium']);
    expect(milho.organismosCandidatos).toEqual(['fixadores']);
  });

  it('classifica cultura corretamente', () => {
    expect(classificaCultura('Soja')).toBe('leguminosa');
    expect(classificaCultura('milho')).toBe('graminea');
    expect(classificaCultura('alface')).toBe('outra');
  });

  it('P baixo adiciona ressalva de que a adubacao pode ser a alavanca principal', () => {
    const r = runDiagnosis({ problema: 'fosforo_indisponivel', pClasse: 'baixo' });
    expect(r.limitations.join(' ')).toContain('adubacao');
  });

  it('umidade encharcada vira limitacao explicita', () => {
    const r = runDiagnosis({ problema: 'doenca_solo', umidade: 'encharcado' });
    expect(r.limitations.join(' ').toLowerCase()).toContain('anaerobiose');
  });

  it('problema desconhecido retorna inconclusivo', () => {
    const r = runDiagnosis({ problema: 'xyz' });
    expect(r.confidence).toBe('inconclusiva');
    expect(r.funcoesPrioritarias).toHaveLength(0);
  });

  it('expoe o catalogo de problemas', () => {
    expect(Object.keys(PROBLEMAS).length).toBeGreaterThanOrEqual(6);
  });
});
