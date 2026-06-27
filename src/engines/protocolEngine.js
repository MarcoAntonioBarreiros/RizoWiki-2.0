// protocolEngine - monta a ficha pratica (rascunho) a partir dos dados do RizoWiki 1.0.
//
// Entrada: { organismo, cultura, quimico, modo, bioinsumoEhAlavancaPrincipal }
// Saida:   { label, culturasReferencia, dose, metodo, ordemDeMistura, manejo, monitorar,
//            contraindicacoes, confidence, source, limitations }
//
// INTEGRIDADE (AGENTS.md 3-4): NAO inventa dose nem manejo. Surfaceia o texto do 1.0
// (verbatim, atribuido a "RizoWiki 1.0") e marca como rascunho/confidence baixa.
// Reusa compatibilityEngine para os impedimentos quimicos (AGENTS.md 6: nao duplica regra).
import organismsData from '../data/organisms.json';
import { evaluateCompatibility } from './compatibilityEngine.js';

export function buildProtocol(input = {}) {
  const {
    organismo,
    quimico = 'nenhum',
    modo = 'tratamento_semente',
    bioinsumoEhAlavancaPrincipal = true,
  } = input;

  const o = organismsData.organisms[organismo];
  const dados = o ? o.protocol : null;
  if (!dados) {
    return {
      organismo: organismo ?? null,
      label: null,
      culturasReferencia: null,
      dose: null,
      metodo: null,
      ordemDeMistura: null,
      manejo: null,
      monitorar: [],
      funcoes: [],
      procedencia: null,
      contraindicacoes: [],
      confidence: 'inconclusiva',
      source: null,
      limitations: ['Organismo sem ficha no rascunho do 1.0; selecione um organismo valido.'],
    };
  }

  // Impedimentos quimicos pelo compatibilityEngine (reuso, sem reescrever regra).
  const contraindicacoes = [];
  if (quimico !== 'nenhum') {
    const compat = evaluateCompatibility({
      organisms: [organismo],
      chemicalClasses: [quimico],
      applicationMode: modo,
    });
    compat.results.forEach((res) => {
      if (res.semaphore === 'vermelho') contraindicacoes.push('Compatibilidade: ' + res.message);
    });
  }
  if (dados.critical) contraindicacoes.push(dados.critical);

  // Procedencia: reflete o bloco _calibration (se houver) para a ficha mostrar
  // o que tem fonte tecnica e o que ainda e rascunho do 1.0.
  const cal = o._calibration || null;
  const calibrado = !!cal;
  const procedencia = calibrado
    ? 'Calibrado parcial - campos com fonte tecnica: ' + (cal.campos_calibrados || []).join(', ') + '.'
      + (cal.pendente ? ' Pendente: ' + cal.pendente : '')
    : 'Protocolo de referencia (RizoWiki 1.0); fonte tecnica de produto ainda pendente.';

  const limitations = [
    calibrado
      ? 'Ficha em CALIBRACAO PARCIAL: parte dos campos foi revisada com fonte tecnica (ver Procedencia); o restante segue como rascunho do 1.0.'
      : 'Ficha em RASCUNHO a partir do RizoWiki 1.0; dose e manejo nao calibrados.',
    'Nao substitui bula, registro do produto nem recomendacao tecnica responsavel.',
    'Ajuste a cultura, ao produto comercial e as condicoes locais.',
  ];
  if (!bioinsumoEhAlavancaPrincipal) {
    limitations.unshift(
      'Atencao: neste cenario o bioinsumo e complemento, nao a alavanca principal ' +
      '(corrigir a limitacao de base primeiro).',
    );
  }

  return {
    organismo,
    label: o.label,
    culturasReferencia: dados.culturas,
    dose: dados.dose_range,
    metodo: dados.metodo,
    ordemDeMistura: dados.ordem_mistura,
    manejo: dados.manejo,
    monitorar: dados.monitorar ?? [],
    funcoes: o.functions ?? [],
    procedencia,
    contraindicacoes,
    confidence: 'baixa',
    source: calibrado ? 'RizoWiki 1.0 + fonte tecnica (calibrado parcial)' : 'RizoWiki 1.0',
    limitations,
  };
}

export default buildProtocol;
