import { describe, expect, it } from 'vitest';
import { buildProtocol } from '../engines/protocolEngine.js';

describe('protocolEngine (ficha rascunho a partir do 1.0)', () => {
  it('monta a ficha do organismo com dose verbatim e fonte 1.0', () => {
    const p = buildProtocol({ organismo: 'bacillus', cultura: 'soja' });
    expect(p.dose).toContain('Esporos');
    expect(p.metodo).toMatch(/Semente|Sulco/);
    expect(p.monitorar.length).toBeGreaterThan(0);
    expect(p.confidence).toBe('baixa');
    expect(p.source).toBe('RizoWiki 1.0');
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
  });
});
