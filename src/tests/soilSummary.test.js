import { describe, expect, it } from 'vitest';
import { buildSoilSummary } from '../engines/soil/soilSummary.js';

describe('buildSoilSummary (orquestracao do solo, R1)', () => {
  it('sem analise: roda nos priors (modelo generico), confianca baixa', () => {
    const s = buildSoilSummary({ cultura: 'soja', soil: {} });
    expect(s.soil.campos_reais).toBe(0);
    expect(s.pInterp.origem).toBe('prior_regional');
    expect(s.pInterp.classe).toBeTruthy(); // gera classe mesmo sem dado (prior)
    expect(s.pConfidence).toBe('baixa');
  });

  it('com P e argila reais: interpreta com dado real e confianca media', () => {
    const s = buildSoilSummary({ cultura: 'soja', soil: { regiao: 'sul_pr', P: 4, argila: 650 } });
    expect(s.pInterp.origem).toBe('real');
    expect(s.pInterp.classe_argila).toBe(1); // 650 g/kg = 65% -> classe 1
    expect(s.pInterp.classe).toBe('baixo'); // sequeiro C1: 2,1-4,0 -> baixo
    expect(s.pClasse).toBe('baixo');
    expect(s.pConfidence).toBe('media');
  });

  it('P real mas argila assumida: NAO sobe a media (decisivo argila e prior)', () => {
    const s = buildSoilSummary({ cultura: 'soja', soil: { regiao: 'sul_pr', P: 4 } });
    expect(s.soil.campos.P.origem).toBe('real');
    expect(s.soil.campos.argila.origem).toBe('prior_regional');
    expect(s.pInterp.origem).toBe('prior_regional');
    expect(s.pConfidence).toBe('baixa');
  });

  it('acidez real entra com pH/V/m informados e sinaliza calagem', () => {
    const s = buildSoilSummary({ cultura: 'soja', soil: { regiao: 'sul_pr', pH: 4.8, V: 40, m: 25 } });
    expect(s.acidez.calagem_indicada).toBe(true);
    expect(s.acidez.acidez_limitante).toBe(true);
    expect(s.acidez.origem).toBe('real');
  });
});
