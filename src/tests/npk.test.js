import { describe, expect, it } from 'vitest';
import { recomendaNpk } from '../engines/soil/npkEngine.js';

describe('npkEngine (recomendacao qualitativa por classe, CQFS 2016)', () => {
  it('soja: N por fixacao biologica - bioinsumo e a alavanca', () => {
    const r = recomendaNpk({ cultura: 'soja', pClasse: 'baixo', kClasse: 'alto' });
    expect(r.N.via).toBe('fixacao_biologica');
    expect(r.N.acao).toBe('inocular');
    expect(r.N.bioinsumo_alavanca).toBe(true);
  });

  it('milho: N mineral - bioinsumo complementa, nao substitui', () => {
    const r = recomendaNpk({ cultura: 'milho', pClasse: 'medio', kClasse: 'medio' });
    expect(r.N.via).toBe('mineral');
    expect(r.N.bioinsumo_alavanca).toBe(false);
  });

  it('P/K: abaixo do critico -> corrigir; adequado -> repor; muito alto -> dispensar', () => {
    const r = recomendaNpk({ cultura: 'soja', pClasse: 'baixo', kClasse: 'alto' });
    expect(r.P.acao).toBe('corrigir');
    expect(r.K.acao).toBe('repor');
    const r2 = recomendaNpk({ cultura: 'soja', pClasse: 'muito_alto', kClasse: 'muito_baixo' });
    expect(r2.P.acao).toBe('dispensar');
    expect(r2.K.acao).toBe('corrigir');
  });

  it('sem classe -> pede o dado (honesto)', () => {
    const r = recomendaNpk({ cultura: 'soja' });
    expect(r.P.acao).toBe('sem_dado');
    expect(r.K.acao).toBe('sem_dado');
  });

  it('cultura desconhecida -> N depende da cultura', () => {
    expect(recomendaNpk({ cultura: 'outra', pClasse: 'alto', kClasse: 'alto' }).N.via).toBe('depende');
  });
});
