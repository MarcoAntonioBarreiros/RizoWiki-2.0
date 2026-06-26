import { describe, expect, it } from 'vitest';
import organismsData from '../data/organisms.json';

const IDS = [
  'bacillus', 'fixadores', 'rhizobium', 'methylobacterium', 'bioinseticidas',
  'pseudomonas', 'trichoderma', 'micorrizas', 'pnsb',
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
});
