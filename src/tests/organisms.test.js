import { describe, expect, it } from 'vitest';
import organismsData from '../data/organisms.json';
import evidence from '../data/evidence/evidence_registry.json';

const IDS = [
  'bacillus', 'fixadores', 'rhizobium', 'methylobacterium', 'bioinseticidas',
  'pseudomonas', 'trichoderma', 'micorrizas', 'pnsb',
];
const CODEX_VIABILITY_IDS = ['bacillus', 'rhizobium', 'trichoderma'];
const NUMERIC_VIABILITY_FIELDS = [
  'ideal_temp_c',
  'decay_k_base_per_h',
  'uv_sensitivity',
  'effective_threshold_log',
  'chemical_sensitivity_by_class',
];

describe('organisms.json (fonte unica consolidada)', () => {
  it('cobre os 9 organismos do 1.0', () => {
    expect(Object.keys(organismsData.organisms).sort()).toEqual([...IDS].sort());
  });

  it('cada organismo tem viability completa para o viabilityEngine', () => {
    for (const id of IDS) {
      const v = organismsData.organisms[id].viability;
      expect(typeof v.ideal_temp_c).toBe('number');
      expect(typeof v.decay_k_base_per_h).toBe('number');
      expect(typeof v.uv_sensitivity).toBe('number');
      expect(typeof v.effective_threshold_log).toBe('number');
      expect(v.chemical_sensitivity_by_class.nenhum).toBe(1);
    }
  });

  it('cada organismo tem protocolo e funcoes', () => {
    for (const id of IDS) {
      const o = organismsData.organisms[id];
      expect(o.protocol.dose_range).toBeTruthy();
      expect(Array.isArray(o.functions)).toBe(true);
      expect(o.functions.length).toBeGreaterThan(0);
    }
  });

  it('tudo marcado como rascunho pendente de revisao', () => {
    expect(organismsData._meta.status).toBe('pendente_revisao');
    for (const id of IDS) {
      expect(organismsData.organisms[id]._status).toBe('pendente_revisao');
    }
  });

  it('bacillus, rhizobium e trichoderma tem viabilidade ancorada sem promover constantes', () => {
    for (const id of CODEX_VIABILITY_IDS) {
      const calibration = organismsData.organisms[id].viability._calibration;
      expect(calibration.status).toBe('direcao_ancorada_sem_constante');
      expect(calibration.ancoras_confirmadas.length).toBeGreaterThan(0);
      expect(calibration.not_promoted_reason).toBeTruthy();

      for (const sourceId of calibration.sources) {
        expect(evidence.sources[sourceId]).toBeTruthy();
      }

      for (const field of NUMERIC_VIABILITY_FIELDS) {
        expect(calibration.numeric_fields_status[field]).toBe('prior_regra');
      }
    }
  });

  it('cada organismo tem limites_operacionais com fonte (Fase V1)', () => {
    for (const id of IDS) {
      const lim = organismsData.organisms[id].limites_operacionais;
      expect(lim).toBeTruthy();
      expect(lim._source).toBeTruthy();
      expect(lim._status).toBeTruthy();
    }
  });
});
