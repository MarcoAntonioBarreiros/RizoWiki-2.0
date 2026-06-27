import { describe, expect, it } from 'vitest';
import {
  resolveSoilContext,
  soilConfidence,
  SOIL_FIELDS,
  CAMPOS_DECISIVOS,
} from '../engines/soil/soilContext.js';

describe('soilContext (degradacao graciosa)', () => {
  it('roda SEM nenhum dado real: tudo prior_regional, regiao default com aviso', () => {
    const r = resolveSoilContext({});
    expect(r.regiao_origem).toBe('assumida_default');
    expect(r.regiao_aviso).toBeTruthy();
    expect(r.campos_reais).toBe(0);
    for (const f of SOIL_FIELDS) {
      expect(['prior_regional', 'ausente']).toContain(r.campos[f].origem);
    }
  });

  it('dado REAL sobrescreve o prior e conta na completude', () => {
    const r = resolveSoilContext({ P: 4, pH: 6.2, regiao: 'sul_pr' });
    expect(r.campos.P.origem).toBe('real');
    expect(r.campos.P.valor).toBe(4);
    expect(r.campos.pH.origem).toBe('real');
    expect(r.campos.V.origem).toBe('prior_regional');
    expect(r.campos_reais).toBe(2);
    expect(r.completude).toBeCloseTo(2 / SOIL_FIELDS.length, 2);
  });

  it('regiao informada nao gera aviso', () => {
    const r = resolveSoilContext({ regiao: 'sul_pr' });
    expect(r.regiao_origem).toBe('informada');
    expect(r.regiao_aviso).toBeNull();
  });

  it('confianca SO sobe a media com campos decisivos REAIS + regiao informada (revisao GPT)', () => {
    const semDados = resolveSoilContext({});
    expect(soilConfidence(semDados, CAMPOS_DECISIVOS.fosforo)).toBe('baixa');

    const comP = resolveSoilContext({ P: 4, argila: 600, regiao: 'sul_pr' });
    expect(soilConfidence(comP, CAMPOS_DECISIVOS.fosforo)).toBe('media');

    // muitos campos preenchidos, mas os DECISIVOS do P seguem prior -> NAO sobe (regra GPT)
    const muitosNaoDecisivos = resolveSoilContext({ pH: 6, V: 60, Al: 0.1, regiao: 'sul_pr' });
    expect(soilConfidence(muitosNaoDecisivos, CAMPOS_DECISIVOS.fosforo)).toBe('baixa');
  });
});
