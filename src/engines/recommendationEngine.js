import organismsData from '../data/organisms.json';
import { runDiagnosis } from './diagnosticEngine.js';
import { buildProtocol } from './protocolEngine.js';
import { assessApplication } from '../utils/riskAssessment.js';

const RISK_PENALTY = {
  go: 0,
  atencao: 18,
  nogo: 72,
};

const MODE_LABELS = {
  tratamento_semente: 'tratamento de semente',
  mistura_tanque: 'mistura em tanque',
  sulco: 'sulco',
  foliar: 'foliar',
};

const MODE_KEYWORDS = {
  tratamento_semente: ['semente', 'sementes', 'ts', 'tratamento de semente'],
  sulco: ['sulco'],
  foliar: ['foliar'],
};

function textHasAny(text, keywords) {
  const normalized = String(text || '').toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function modeFit({ protocolo, modo, quimico }) {
  if (modo === 'mistura_tanque') {
    return {
      penalty: 0,
      status: 'avaliado_por_compatibilidade',
      message: quimico === 'nenhum'
        ? 'Mistura em tanque sem quimico informado: sem alerta especifico de compatibilidade.'
        : 'Mistura em tanque avaliada pelas regras de compatibilidade quimica.',
    };
  }

  const metodo = protocolo?.metodo || '';
  const supported = textHasAny(metodo, MODE_KEYWORDS[modo] || []);
  if (supported) {
    return {
      penalty: 0,
      status: 'compativel_com_protocolo',
      message: `Modo selecionado (${MODE_LABELS[modo] || modo}) aparece no protocolo atual.`,
    };
  }

  return {
    penalty: 16,
    status: 'modo_nao_citado',
    message: `Modo selecionado (${MODE_LABELS[modo] || modo}) nao aparece no protocolo atual deste organismo; revisar produto/ficha antes de usar assim.`,
  };
}

function stageFit({ estadio, modo }) {
  if (estadio !== 'pre_semeadura' && modo === 'tratamento_semente') {
    return {
      penalty: 18,
      message: 'Tratamento de semente e coerente antes da semeadura; no estadio atual, revisar se o modo ainda se aplica.',
    };
  }

  if (estadio === 'pre_semeadura' && modo === 'foliar') {
    return {
      penalty: 12,
      message: 'Aplicacao foliar em pre-semeadura nao fecha com a fase informada; revisar estadio ou modo.',
    };
  }

  return { penalty: 0, message: null };
}

function recommendationStatus(score, riskSemaphore) {
  if (riskSemaphore === 'nogo' || score < 45) return 'evitar_agora';
  if (riskSemaphore === 'atencao' || score < 75) return 'ajustar';
  return 'recomendado';
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

export function buildMapRecommendations(input = {}) {
  const diagnosis = runDiagnosis(input);
  const candidatos = diagnosis.organismosCandidatos || [];

  const rankedRecommendations = candidatos
    .map((organismo, index) => {
      const organismData = organismsData.organisms[organismo];
      const protocolo = buildProtocol({
        organismo,
        cultura: input.cultura,
        quimico: input.quimico,
        modo: input.modo,
        bioinsumoEhAlavancaPrincipal: diagnosis.bioinsumoEhAlavancaPrincipal,
      });
      const risk = assessApplication({ ...input, organismo });
      const fit = modeFit({ protocolo, modo: input.modo, quimico: input.quimico });
      const stage = stageFit({ estadio: input.estadio, modo: input.modo });
      const baseScore = 100 - index * 4;
      const score = Math.max(0, Math.round(baseScore - (RISK_PENALTY[risk.semaphore] || 0) - fit.penalty - stage.penalty));
      const matchingFunctions = (organismData?.functions || []).filter((fn) =>
        diagnosis.funcoesPrioritarias.includes(fn),
      );

      const reasons = [
        matchingFunctions.length > 0
          ? `Atende funcoes prioritarias: ${matchingFunctions.join(', ')}.`
          : 'Candidato vem da regra diagnostica do problema/cultura informado.',
        fit.status === 'compativel_com_protocolo' ? fit.message : null,
      ];
      const alerts = [
        fit.status !== 'compativel_com_protocolo' ? fit.message : null,
        stage.message,
        ...risk.flags.map((flag) => flag.mensagem),
      ];
      const actions = unique([
        ...risk.flags.map((flag) => flag.acao),
        fit.status === 'modo_nao_citado' ? 'Conferir ficha tecnica/bula antes de aplicar neste modo.' : null,
      ]);

      return {
        organism: organismo,
        label: organismData?.label || organismo,
        score,
        status: recommendationStatus(score, risk.semaphore),
        riskSemaphore: risk.semaphore,
        reasons: unique(reasons),
        alerts: unique(alerts),
        actions,
        confidence: risk.confidence === 'inconclusiva' ? 'inconclusiva' : diagnosis.confidence,
        risk,
      };
    })
    .sort((a, b) => b.score - a.score);

  const limitations = unique([
    ...diagnosis.limitations,
    'Ranking do Mapa V0.5: problema/cultura definem candidatos; modo, quimico, umidade, estadio, UV e tempo rebaixam ou bloqueiam a recomendacao.',
    'Os rebaixamentos usam regras e priors em curadoria; onde faltar fonte especifica, a saida permanece baixa/inconclusiva.',
  ]);

  return {
    diagnosis,
    rankedRecommendations,
    topRecommendation: rankedRecommendations[0] || null,
    confidence: diagnosis.confidence,
    limitations,
  };
}

export default buildMapRecommendations;
