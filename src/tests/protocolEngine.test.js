import { describe, expect, it } from 'vitest';
import { buildProtocol } from '../engines/protocolEngine.js';

describe('protocolEngine (ficha rascunho a partir do 1.0)', () => {
  it('monta a ficha do organismo com dose de rascunho e fonte tecnica parcial', () => {
    const p = buildProtocol({ organismo: 'bacillus', cultura: 'soja' });
    expect(p.dose).toContain('Esporos');
    expect(p.metodo).toMatch(/semente|sulco/i);
    expect(p.monitorar.length).toBeGreaterThan(0);
    expect(p.confidence).toBe('media');
    expect(p.source).toBe('RizoWiki 1.0 + fonte tecnica (calibrado parcial)');
    expect(p.references.map((ref) => ref.id)).toContain('embrapa_biomaphos_cot252');
  });

  it('puxa contraindicacao do compatibilityEngine (trichoderma + fungicida = vermelho)', () => {
    const p = buildProtocol({ organismo: 'trichoderma', quimico: 'fungicida', modo: 'mistura_tanque' });
    expect(p.contraindicacoes.length).toBeGreaterThan(0);
    expect(p.contraindicacoes.join(' ').toLowerCase()).toContain('fungicida');
  });

  it('inclui o ponto critico do 1.0 mesmo sem quimico', () => {
    const p = buildProtocol({ organismo: 'rhizobium', quimico: 'nenhum' });
    expect(p.contraindicacoes.length).toBeGreaterThan(0);
  });

  it('sinaliza quando o bioinsumo nao e a alavanca principal', () => {
    const p = buildProtocol({ organismo: 'bacillus', bioinsumoEhAlavancaPrincipal: false });
    expect(p.limitations.join(' ').toLowerCase()).toContain('complemento');
  });

  it('organismo desconhecido retorna inconclusivo', () => {
    const p = buildProtocol({ organismo: 'xyz' });
    expect(p.confidence).toBe('inconclusiva');
    expect(p.dose).toBeNull();
  });

  it('expoe funcoes e procedencia; marca calibrado parcial quando ha _calibration', () => {
    const fix = buildProtocol({ organismo: 'fixadores' });
    expect(Array.isArray(fix.funcoes)).toBe(true);
    expect(fix.funcoes.length).toBeGreaterThan(0);
    expect(fix.procedencia.toLowerCase()).toContain('calibrado parcial');
    expect(fix.confidence).toBe('media');
    expect(fix.references.length).toBeGreaterThan(0);
    expect(fix.references[0].title).toBeTruthy();
  });

  it('estrutura referencias e pendencias para organismos calibrados parcialmente', () => {
    const pnsb = buildProtocol({ organismo: 'pnsb' });
    expect(pnsb.references.map((ref) => ref.id)).toContain('scielo_rpalustris_soybean_photosynthesis');
    expect(pnsb.pending.toLowerCase()).toContain('doses');
    expect(pnsb.calibratedFields).toContain('protocol.metodo');
  });

  it('mantem Bacillus, Rhizobium e Trichoderma no mesmo padrao de calibracao parcial', () => {
    const expectedRefs = {
      bacillus: 'embrapa_biomaphos_cot252',
      rhizobium: 'infoteca_bradyrhizobium_seed_soy_548660',
      trichoderma: 'infoteca_trichoderma_manejo_925302',
    };

    for (const [organismo, sourceId] of Object.entries(expectedRefs)) {
      const p = buildProtocol({ organismo });
      expect(p.procedencia.toLowerCase()).toContain('calibrado parcial');
      expect(p.confidence).toBe('media');
      expect(p.references.map((ref) => ref.id)).toContain(sourceId);
      expect(p.pending).toBeTruthy();
      expect(p.calibratedFields).toContain('limites_operacionais');
    }
  });
});
