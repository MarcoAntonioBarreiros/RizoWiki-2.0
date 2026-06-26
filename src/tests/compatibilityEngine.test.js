import { describe, expect, it } from 'vitest';
import { evaluateCompatibility, normalizeChemicalClass, normalizeOrganismId } from '../engines/compatibilityEngine.js';

describe('compatibilityEngine', () => {
  it('normaliza aliases de organismo e classe quimica', () => {
    expect(normalizeOrganismId('mycorrhiza')).toBe('micorrizas');
    expect(normalizeChemicalClass('cobre')).toBe('cuprico_metal');
    expect(normalizeChemicalClass('c\u00faprico')).toBe('cuprico_metal');
  });

  it('marca Trichoderma + fungicida como vermelho', () => {
    const result = evaluateCompatibility({
      organisms: ['trichoderma'],
      chemicalClasses: ['fungicida'],
      applicationMode: 'mistura_tanque',
    });

    expect(result.semaphore).toBe('vermelho');
    expect(result.results[0]).toMatchObject({
      organism: 'trichoderma',
      chemical_class: 'fungicida',
      effect: 'alto_risco',
      confidence: 'baixa',
      source: 'RizoWiki 1.0',
    });
  });

  it('marca rizobio + cuprico como alto risco com limitacao sobre Co/Mo', () => {
    const result = evaluateCompatibility({
      organisms: ['rhizobium'],
      chemicalClasses: ['cobre'],
      applicationMode: 'tratamento_semente',
    });

    expect(result.semaphore).toBe('vermelho');
    expect(result.results[0].effect).toBe('alto_risco');
    expect(result.results[0].limitations.join(' ')).toContain('Co/Mo');
  });

  it('mantem Bacillus esporulado em cautela, nao vermelho, com fungicida', () => {
    const result = evaluateCompatibility({
      organisms: ['bacillus'],
      chemicalClasses: ['fungicida'],
      applicationMode: 'mistura_tanque',
    });

    expect(result.semaphore).toBe('amarelo');
    expect(result.results[0]).toMatchObject({
      organism: 'bacillus',
      chemical_class: 'fungicida',
      effect: 'risco_moderado',
      confidence: 'baixa',
    });
  });

  it('retorna inconclusivo quando nao existe regra especifica', () => {
    const result = evaluateCompatibility({
      organisms: ['pseudomonas'],
      chemicalClasses: ['fungicida'],
    });

    expect(result.results[0].semaphore).toBe('verde');
    expect(result.results[0].confidence).toBe('inconclusiva');
    expect(result.results[0].limitations.join(' ')).toContain('nao confirma compatibilidade');
  });
});
