import { describe, expect, it } from 'vitest';
import {
  interpretaP,
  classeArgila,
  grupoCulturaP,
  paraPClasse,
} from '../engines/soil/pInterpretationEngine.js';

describe('pInterpretationEngine (CQFS-RS/SC 2016, Grupo II, sourced)', () => {
  it('classe de argila por % e por g/kg', () => {
    expect(classeArgila(60)).toBe(2);
    expect(classeArgila(61)).toBe(1);
    expect(classeArgila(20)).toBe(4);
    expect(classeArgila(600)).toBe(2); // 600 g/kg = 60% -> classe 2
    expect(classeArgila(350)).toBe(3); // 350 g/kg = 35% -> classe 3
  });

  it('mesmo P, classes de argila diferentes -> interpretacao diferente', () => {
    const argiloso = interpretaP({ valor: 5, extrator: 'mehlich1', argila: 65, cultura: 'soja' }); // classe 1
    const arenoso = interpretaP({ valor: 5, extrator: 'mehlich1', argila: 15, cultura: 'soja' }); // classe 4
    expect(argiloso.classe_argila).toBe(1);
    expect(argiloso.classe).toBe('baixo'); // Grupo II C1: 3,1-6,0 -> baixo
    expect(arenoso.classe_argila).toBe(4);
    expect(arenoso.classe).toBe('muito_baixo'); // Grupo II C4: <=10
  });

  it('graos e frutiferas usam a MESMA tabela (Grupo II 2016)', () => {
    expect(grupoCulturaP('soja')).toBe('grupo_ii');
    expect(grupoCulturaP('nogueira-peca')).toBe('grupo_ii');
    const graos = interpretaP({ valor: 5, extrator: 'mehlich1', argila: 65, cultura: 'soja' });
    const fruta = interpretaP({ valor: 5, extrator: 'mehlich1', argila: 65, cultura: 'nogueira' });
    expect(graos.classe).toBe(fruta.classe); // mesma tabela -> mesma classe
    expect(graos.classe).toBe('baixo');
  });

  it('resina independe de argila e usa critico 20', () => {
    const r = interpretaP({ valor: 15, extrator: 'resina', cultura: 'soja' });
    expect(r.extrator).toBe('resina');
    expect(r.classe).toBe('medio');
    expect(r.critico).toBe(20);
    expect(r.abaixo_critico).toBe(true);
  });

  it('Mehlich-1 SEM argila pede o teor de argila', () => {
    const r = interpretaP({ valor: 5, extrator: 'mehlich1', cultura: 'soja' });
    expect(r.classe).toBeNull();
    expect(r._status).toBe('argila_ausente');
  });

  it('sem valor de P -> nao classifica', () => {
    const r = interpretaP({ extrator: 'mehlich1', argila: 65, cultura: 'soja' });
    expect(r.classe).toBeNull();
    expect(r._status).toBe('sem_dado');
  });

  it('campo vazio do formulario ("") conta como ausente, nao como 0', () => {
    expect(interpretaP({ valor: '', argila: 65, cultura: 'soja' })._status).toBe('sem_dado');
    expect(interpretaP({ valor: 5, argila: '', cultura: 'soja' })._status).toBe('argila_ausente');
  });

  it('ponte para o vocabulario pClasse do diagnosticEngine', () => {
    expect(paraPClasse('muito_baixo')).toBe('baixo');
    expect(paraPClasse('baixo')).toBe('baixo');
    expect(paraPClasse('medio')).toBe('medio');
    expect(paraPClasse('alto')).toBe('alto');
    expect(paraPClasse('muito_alto')).toBe('alto');
  });

  it('Grupo II classe 1: critico 9 (era 6 na ed. 2004); origem prior rebaixa confianca', () => {
    const real = interpretaP({ valor: 5, extrator: 'mehlich1', argila: 65, cultura: 'soja', origem: 'real' });
    expect(real.critico).toBe(9);
    expect(real.abaixo_critico).toBe(true); // 5 < 9
    expect(real.confidence).toBe('media');

    const prior = interpretaP({ valor: 8, extrator: 'mehlich1', argila: 65, cultura: 'soja', origem: 'prior_regional' });
    expect(prior.classe).toBe('medio'); // 8 em C1 Grupo II: 6,1-9 -> medio (era 'alto' na ed. 2004)
    expect(prior.confidence).toBe('baixa');
  });
});
