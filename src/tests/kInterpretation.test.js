import { describe, expect, it } from 'vitest';
import { interpretaK, classeCTC, paraKClasse } from '../engines/soil/kInterpretationEngine.js';

describe('kInterpretationEngine (CQFS-RS/SC 2016, Tabela 6, sourced)', () => {
  it('classe de CTC (4 classes da ed. 2016)', () => {
    expect(classeCTC(7.5)).toBe('A');
    expect(classeCTC(7.6)).toBe('B');
    expect(classeCTC(15)).toBe('B');
    expect(classeCTC(15.1)).toBe('C');
    expect(classeCTC(30)).toBe('C');
    expect(classeCTC(31)).toBe('D');
  });

  it('mesmo K, CTC diferente -> interpretacao diferente', () => {
    const ctcBaixa = interpretaK({ valor: 50, ctc: 6 }); // classe A
    const ctcAlta = interpretaK({ valor: 50, ctc: 20 }); // classe C
    expect(ctcBaixa.classe_ctc).toBe('A');
    expect(ctcBaixa.classe).toBe('medio'); // A: 41-60 -> medio
    expect(ctcAlta.classe_ctc).toBe('C');
    expect(ctcAlta.classe).toBe('baixo'); // C: 41-80 -> baixo
  });

  it('critico e abaixo_critico', () => {
    const r = interpretaK({ valor: 100, ctc: 6 }); // A: critico 60
    expect(r.classe).toBe('alto'); // A: 61-120
    expect(r.critico).toBe(60);
    expect(r.abaixo_critico).toBe(false);
    expect(interpretaK({ valor: 30, ctc: 6 }).abaixo_critico).toBe(true); // 30 < 60
  });

  it('K SEM CTC pede a CTC (degradacao honesta)', () => {
    const r = interpretaK({ valor: 50 });
    expect(r.classe).toBeNull();
    expect(r._status).toBe('ctc_ausente');
  });

  it('sem valor de K / campo vazio -> nao classifica', () => {
    expect(interpretaK({ ctc: 6 })._status).toBe('sem_dado');
    expect(interpretaK({ valor: '', ctc: 6 })._status).toBe('sem_dado');
  });

  it('ponte paraKClasse', () => {
    expect(paraKClasse('muito_baixo')).toBe('baixo');
    expect(paraKClasse('medio')).toBe('medio');
    expect(paraKClasse('muito_alto')).toBe('alto');
  });

  it('origem prior_regional rebaixa a confianca', () => {
    expect(interpretaK({ valor: 50, ctc: 6, origem: 'real' }).confidence).toBe('media');
    expect(interpretaK({ valor: 50, ctc: 6, origem: 'prior_regional' }).confidence).toBe('baixa');
  });
});
