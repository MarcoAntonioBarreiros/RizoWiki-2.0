import { describe, expect, it } from 'vitest';
import { interpretaCompactacao } from '../engines/soil/compactacaoEngine.js';

describe('compactacaoEngine (Reichert 2003 + RP, sourced)', () => {
  it('mesma densidade, texturas diferentes -> veredito diferente (Dsc por textura)', () => {
    const argiloso = interpretaCompactacao({ densidade: 1.5, argila: 700 }); // classe 1, Dsc 1,30
    const arenoso = interpretaCompactacao({ densidade: 1.5, argila: 150 }); // classe 4, Dsc 1,75
    expect(argiloso.densidade.classe_argila).toBe(1);
    expect(argiloso.restricao).toBe('severa');
    expect(argiloso.compactado).toBe(true);
    expect(arenoso.densidade.classe_argila).toBe(4);
    expect(arenoso.restricao).toBe('baixa');
    expect(arenoso.compactado).toBe(false);
  });

  it('RP alta sinaliza restricao COM ressalva de umidade (Busscher)', () => {
    const r = interpretaCompactacao({ rp: 2.8 });
    expect(r.rp.restricao).toBe('severa');
    expect(r.compactado).toBe(true);
    expect(r.rp._caveat).toMatch(/umidade/i);
  });

  it('RP baixa nao restringe', () => {
    expect(interpretaCompactacao({ rp: 1.5 }).restricao).toBe('baixa');
  });

  it('compactado => honestidade: descompactacao e a alavanca, bioinsumo secundario', () => {
    const r = interpretaCompactacao({ densidade: 1.6, argila: 500 }); // classe 2, Dsc 1,40
    expect(r.compactado).toBe(true);
    expect(r.mensagem).toMatch(/descompactacao/i);
    expect(r.mensagem).toMatch(/secundario/i);
    expect(r.dose_nota).toBeTruthy();
  });

  it('faixa de atencao (proximo do critico) -> moderada', () => {
    // classe 2 Dsc 1,40, margem 0,05 -> 1,35 a 1,39 = moderada
    const r = interpretaCompactacao({ densidade: 1.37, argila: 500 });
    expect(r.densidade.restricao).toBe('moderada');
  });

  it('densidade SEM argila nao pode ser julgada (honesto)', () => {
    const r = interpretaCompactacao({ densidade: 1.5 });
    expect(r._status).toBe('argila_ausente');
  });

  it('sem nenhum dado -> inconclusiva', () => {
    expect(interpretaCompactacao({})._status).toBe('sem_dado');
  });

  it('origem prior_regional rebaixa a confianca', () => {
    expect(
      interpretaCompactacao({ densidade: 1.6, argila: 500, origem: 'prior_regional' }).confidence,
    ).toBe('baixa');
  });
});
