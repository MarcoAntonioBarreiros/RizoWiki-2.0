import { describe, expect, it } from 'vitest';
import evidence from '../data/evidence/evidence_registry.json';
import organismsData from '../data/organisms.json';

const ALLOWED_SOURCE_TYPES = new Set([
  'publicacao_tecnica_oficial',
  'noticia_oficial',
  'bula',
  'ficha_tecnica',
  'artigo_revisado',
  'manual_oficial',
]);

const ALLOWED_STATUSES = new Set([
  'fonte_candidata',
  'evidencia_registrada',
  'calibrado_parcial',
  'calibrado',
]);

describe('evidence registry', () => {
  it('tem fontes com ids unicos, urls e tipos reconhecidos', () => {
    const sourceIds = Object.keys(evidence.sources);
    expect(sourceIds.length).toBeGreaterThan(0);
    expect(new Set(sourceIds).size).toBe(sourceIds.length);

    for (const source of Object.values(evidence.sources)) {
      expect(source.title).toBeTruthy();
      expect(source.url).toMatch(/^https:\/\//);
      expect(ALLOWED_SOURCE_TYPES.has(source.source_type)).toBe(true);
    }
  });

  it('claims referenciam fontes existentes e organismos validos', () => {
    const organismIds = new Set(Object.keys(organismsData.organisms));

    for (const claim of evidence.claims) {
      expect(evidence.sources[claim.source_id]).toBeTruthy();
      expect(ALLOWED_STATUSES.has(claim.status)).toBe(true);
      expect(claim.claim).toBeTruthy();
      expect(claim.calibration_action).toBeTruthy();
      expect(Array.isArray(claim.organisms)).toBe(true);
      claim.organisms.forEach((id) => expect(organismIds.has(id)).toBe(true));
    }
  });

  it('primeira rodada registra evidencias sem promover parametros numericos', () => {
    expect(evidence._meta.status).toBe('curadoria_inicial');
    expect(evidence.claims.some((claim) => claim.status === 'calibrado')).toBe(false);
    expect(evidence._meta.scope).toContain('Nenhum parametro numerico foi promovido');
  });

  it('claims de viabilidade dos tres organismos do Codex nao promovem constantes', () => {
    const focus = ['bacillus', 'rhizobium', 'trichoderma'];
    const claims = evidence.claims.filter((claim) =>
      focus.some((id) => claim.organisms.includes(id)) &&
      claim.supports_fields.includes('viability._calibration')
    );

    expect(claims.length).toBeGreaterThanOrEqual(4);
    expect(new Set(claims.flatMap((claim) => claim.organisms).filter((id) => focus.includes(id)))).toEqual(new Set(focus));

    for (const claim of claims) {
      expect(evidence.sources[claim.source_id]).toBeTruthy();
      expect(claim.status).not.toBe('calibrado');
      expect(claim.does_not_support_yet.join(' ')).toMatch(/decay_k|uv_sensitivity|chemical_sensitivity|effective_threshold|valor numerico/);
    }
  });
});
