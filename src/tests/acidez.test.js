import { describe, expect, it } from 'vitest';
import { interpretaAcidez } from '../engines/soil/acidezEngine.js';

describe('acidezEngine (CQFS-RS/SC 2016, Tabela 5.1, sourced)', () => {
  it('solo acido: classifica pH/V/m e indica calagem como alavanca principal', () => {
    const r = interpretaAcidez({ pH: 4.8, V: 40, m: 25 });
    expect(r.pH.classe).toBe('muito_baixo');
    expect(r.V.classe).toBe('muito_baixo');
    expect(r.m.classe).toBe('alto');
    expect(r.m.toxidez).toBe('alta');
    expect(r.calagem_indicada).toBe(true);
    expect(r.acidez_limitante).toBe(true);
    expect(r.calagem_motivos.length).toBe(3);
  });

  it('solo corrigido: nao indica calagem', () => {
    const r = interpretaAcidez({ pH: 6.2, V: 75, m: 0 });
    expect(r.pH.classe).toBe('alto');
    expect(r.V.classe).toBe('medio'); // 75 -> 65-80
    expect(r.m.classe).toBe('muito_baixo');
    expect(r.calagem_indicada).toBe(false);
    expect(r.acidez_limitante).toBe(false);
  });

  it('saturacao por Al: maior e PIOR (direcao invertida vs pH/V)', () => {
    const r = interpretaAcidez({ m: 15 });
    expect(r.m.classe).toBe('medio');
    expect(r.m.toxidez).toBe('moderada');
    expect(r.calagem_indicada).toBe(true); // m > 10
  });

  it('limites das bandas conferem com o manual', () => {
    expect(interpretaAcidez({ pH: 5.0 }).pH.classe).toBe('muito_baixo');
    expect(interpretaAcidez({ pH: 5.4 }).pH.classe).toBe('baixo');
    expect(interpretaAcidez({ pH: 5.5 }).pH.classe).toBe('medio');
    expect(interpretaAcidez({ pH: 6.1 }).pH.classe).toBe('alto');

    expect(interpretaAcidez({ V: 44 }).V.classe).toBe('muito_baixo');
    expect(interpretaAcidez({ V: 45 }).V.classe).toBe('baixo');
    expect(interpretaAcidez({ V: 64 }).V.classe).toBe('baixo');
    expect(interpretaAcidez({ V: 65 }).V.classe).toBe('medio');
    expect(interpretaAcidez({ V: 81 }).V.classe).toBe('alto');

    expect(interpretaAcidez({ m: 0.5 }).m.classe).toBe('muito_baixo');
    expect(interpretaAcidez({ m: 10 }).m.classe).toBe('baixo');
    expect(interpretaAcidez({ m: 20 }).m.classe).toBe('medio');
    expect(interpretaAcidez({ m: 21 }).m.classe).toBe('alto');
  });

  it('degradacao graciosa: roda com 1 indicador so', () => {
    const r = interpretaAcidez({ pH: 5.2 });
    expect(r.pH.classe).toBe('baixo');
    expect(r.V).toBeUndefined();
    expect(r.m).toBeUndefined();
    expect(r.calagem_indicada).toBe(true); // pH 5,2 < 5,5
  });

  it('sem nenhum dado -> inconclusiva (honesto)', () => {
    const r = interpretaAcidez({});
    expect(r._status).toBe('sem_dado');
    expect(r.confidence).toBe('inconclusiva');
  });

  it('origem prior_regional rebaixa a confianca', () => {
    expect(interpretaAcidez({ pH: 5.2, origem: 'prior_regional' }).confidence).toBe('baixa');
    expect(interpretaAcidez({ pH: 5.2, origem: 'real' }).confidence).toBe('media');
  });
});
