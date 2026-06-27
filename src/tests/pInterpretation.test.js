import { describe, expect, it } from 'vitest';
import {
  interpretaP,
  classeArgila,
  grupoCulturaP,
  paraPClasse,
} from '../engines/soil/pInterpretationEngine.js';

describe('pInterpretationEngine (CQFS-RS/SC 2016, sourced)', () => {
  it('classe de argila por % e por g/kg (Tabela 5.2)', () => {
    expect(classeArgila(60)).toBe(2); // 41-60% -> classe 2
    expect(classeArgila(61)).toBe(1); // >60% -> classe 1
    expect(classeArgila(20)).toBe(4); // <=20% -> classe 4
    expect(classeArgila(600)).toBe(2); // 600 g/kg = 60% -> classe 2
    expect(classeArgila(350)).toBe(3); // 350 g/kg = 35% -> classe 3
  });

  it('mesmo P, classes de argila diferentes -> interpretacao diferente (sequeiro)', () => {
    const argiloso = interpretaP({ valor: 5, extrator: 'mehlich1', argila: 65, cultura: 'soja' });
    const arenoso = interpretaP({ valor: 5, extrator: 'mehlich1', argila: 15, cultura: 'soja' });
    expect(argiloso.classe_argila).toBe(1);
    expect(argiloso.classe).toBe('medio'); // C1: 4,1-6,0
    expect(arenoso.classe_argila).toBe(4);
    expect(arenoso.classe).toBe('muito_baixo'); // C4: <=7,0
  });

  it('grupo de cultura muda a tabela (graos vs frutiferas)', () => {
    expect(grupoCulturaP('soja')).toBe('sequeiro');
    expect(grupoCulturaP('milho')).toBe('sequeiro');
    expect(grupoCulturaP('nogueira-peca')).toBe('frutiferas');
    const graos = interpretaP({ valor: 5, extrator: 'mehlich1', argila: 65, cultura: 'soja' });
    const fruta = interpretaP({ valor: 5, extrator: 'mehlich1', argila: 65, cultura: 'nogueira' });
    expect(graos.classe).toBe('medio'); // sequeiro C1
    expect(fruta.classe).toBe('baixo'); // frutiferas C1: 3,1-6,0
  });

  it('resina independe de argila e usa critico 20 (Tabela 5.4)', () => {
    const r = interpretaP({ valor: 15, extrator: 'resina', cultura: 'soja' });
    expect(r.extrator).toBe('resina');
    expect(r.classe).toBe('medio');
    expect(r.critico).toBe(20);
    expect(r.abaixo_critico).toBe(true);
  });

  it('Mehlich-1 SEM argila pede o teor de argila (degradacao honesta)', () => {
    const r = interpretaP({ valor: 5, extrator: 'mehlich1', cultura: 'soja' });
    expect(r.classe).toBeNull();
    expect(r._status).toBe('argila_ausente');
  });

  it('sem valor de P -> nao classifica e diz o que falta', () => {
    const r = interpretaP({ extrator: 'mehlich1', argila: 65, cultura: 'soja' });
    expect(r.classe).toBeNull();
    expect(r._status).toBe('sem_dado');
  });

  it('ponte para o vocabulario pClasse do diagnosticEngine', () => {
    expect(paraPClasse('muito_baixo')).toBe('baixo');
    expect(paraPClasse('baixo')).toBe('baixo');
    expect(paraPClasse('medio')).toBe('medio');
    expect(paraPClasse('alto')).toBe('alto');
    expect(paraPClasse('muito_alto')).toBe('alto');
  });

  it('origem prior_regional rebaixa a confianca; abaixo do critico e sinalizado', () => {
    const real = interpretaP({ valor: 5, extrator: 'mehlich1', argila: 65, cultura: 'soja', origem: 'real' });
    const prior = interpretaP({ valor: 8, extrator: 'mehlich1', argila: 65, cultura: 'soja', origem: 'prior_regional' });
    expect(real.confidence).toBe('media');
    expect(real.abaixo_critico).toBe(true); // 5 < critico 6 (C1 sequeiro)
    expect(prior.confidence).toBe('baixa');
    expect(prior.classe).toBe('alto'); // 8 em C1 sequeiro: 6,1-12,0 -> alto
  });
});
