import { describe, expect, it } from 'vitest';
import { buildMapRecommendations } from '../engines/recommendationEngine.js';

describe('recommendationEngine (Mapa V0.5)', () => {
  it('ranqueia candidatos usando quimico e modo, nao apenas problema/cultura', () => {
    const base = buildMapRecommendations({
      cultura: 'soja',
      problema: 'doenca_solo',
      pClasse: 'medio',
      umidade: 'adequado',
      quimico: 'nenhum',
      modo: 'tratamento_semente',
      estadio: 'pre_semeadura',
      horas: 6,
      refrigerado: false,
      exposicaoUV: false,
    });
    const comFungicida = buildMapRecommendations({
      cultura: 'soja',
      problema: 'doenca_solo',
      pClasse: 'medio',
      umidade: 'adequado',
      quimico: 'fungicida',
      modo: 'mistura_tanque',
      estadio: 'pre_semeadura',
      horas: 6,
      refrigerado: false,
      exposicaoUV: false,
    });

    expect(base.topRecommendation.organism).toBe('trichoderma');
    expect(comFungicida.topRecommendation.organism).not.toBe('trichoderma');
    expect(comFungicida.rankedRecommendations.find((item) => item.organism === 'trichoderma').status).toBe('evitar_agora');
  });

  it('rebaixa modo que nao aparece no protocolo do organismo', () => {
    const result = buildMapRecommendations({
      cultura: 'soja',
      problema: 'baixa_fixacao_n',
      pClasse: 'medio',
      umidade: 'adequado',
      quimico: 'nenhum',
      modo: 'foliar',
      estadio: 'vegetativo',
      horas: 6,
      refrigerado: false,
      exposicaoUV: true,
    });

    expect(result.topRecommendation.organism).toBe('rhizobium');
    expect(result.topRecommendation.alerts.join(' ')).toContain('foliar');
    expect(result.topRecommendation.score).toBeLessThan(100);
  });

  it('mantem acidez/fertilidade sem candidato e sem falsa recomendacao', () => {
    const result = buildMapRecommendations({
      cultura: 'milho',
      problema: 'acidez_fertilidade',
      pClasse: 'baixo',
      umidade: 'adequado',
      quimico: 'nenhum',
      modo: 'sulco',
    });

    expect(result.rankedRecommendations).toHaveLength(0);
    expect(result.diagnosis.bioinsumoEhAlavancaPrincipal).toBe(false);
  });
});
