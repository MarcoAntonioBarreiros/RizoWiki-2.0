import { describe, expect, it } from 'vitest';
import { buildMapRecommendations } from '../engines/recommendationEngine.js';

// Acoplamento da analise de solo ao ranking: quando a acidez e limitante OU a compactacao e severa
// (dado REAL), o bioinsumo deixa de ser a alavanca e os candidatos sao rebaixados uniformemente.
const baseInput = {
  cultura: 'soja',
  problema: 'fosforo_indisponivel',
  umidade: 'adequado',
  quimico: 'nenhum',
  modo: 'tratamento_semente',
  estadio: 'pre_semeadura',
};

describe('acoplamento solo -> ranking (limitacao de base real)', () => {
  it('SEM o sinal: bioinsumo segue como alavanca (comportamento inalterado)', () => {
    const r = buildMapRecommendations(baseInput);
    expect(r.diagnosis.bioinsumoEhAlavancaPrincipal).toBe(true);
    expect(r.rankedRecommendations.length).toBeGreaterThan(0);
  });

  it('COM limitacao de base real: marca bioinsumo NAO-alavanca e rebaixa o escore', () => {
    const sem = buildMapRecommendations(baseInput);
    const com = buildMapRecommendations({ ...baseInput, soilBaseLimitante: { tipos: ['acidez'] } });
    expect(com.diagnosis.bioinsumoEhAlavancaPrincipal).toBe(false);
    expect(com.topRecommendation.score).toBeLessThan(sem.topRecommendation.score);
    expect(com.rankedRecommendations[0].alerts.some((a) => /limitacao de base/i.test(a))).toBe(true);
    expect(com.limitations.some((l) => /limitacao de base real/i.test(l))).toBe(true);
  });

  it('penalidade UNIFORME nao reordena os candidatos', () => {
    const sem = buildMapRecommendations(baseInput);
    const com = buildMapRecommendations({ ...baseInput, soilBaseLimitante: { tipos: ['compactacao'] } });
    expect(com.rankedRecommendations.map((x) => x.organism)).toEqual(
      sem.rankedRecommendations.map((x) => x.organism),
    );
  });

  it('acidez + compactacao juntas aparecem na mensagem', () => {
    const com = buildMapRecommendations({
      ...baseInput,
      soilBaseLimitante: { tipos: ['acidez', 'compactacao'] },
    });
    expect(com.rankedRecommendations[0].alerts.some((a) => /acidez e compactacao/i.test(a))).toBe(true);
  });
});
