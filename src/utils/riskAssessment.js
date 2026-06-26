// riskAssessment - logica da aba Fatores (brief secao 6).
// NAO e um motor novo: orquestra viabilityEngine + compatibilityEngine e agrega o
// resultado num veredito go/no-go com acao corretiva (AGENTS.md 6: nao duplica logica).
import viabilityPriors from '../data/viability_priors_draft.json';
import { simulateViability } from '../engines/viabilityEngine.js';
import { evaluateCompatibility } from '../engines/compatibilityEngine.js';

// Mapeamentos simples do checklist -> entradas dos motores (priors nao calibrados).
const TEMP_REFRIGERADO = 8;
const TEMP_AMBIENTE = 30;
const N0_PADRAO = 9; // log UFC assumido para o checklist (entrada simplificada).

export function assessApplication(input = {}) {
  const {
    organismo,
    horas = 0,
    refrigerado = false,
    exposicaoUV = false,
    umidade = 'adequado',
    quimico = 'nenhum',
    modo = 'mistura_tanque',
  } = input;

  const flags = [];
  const prior = viabilityPriors.organisms[organismo];

  // 1) Viabilidade no tempo (reusa viabilityEngine) - so com prior do organismo.
  let viability = null;
  if (prior) {
    viability = simulateViability({
      organism: prior,
      initialLog: N0_PADRAO,
      hours: horas,
      temperatureC: refrigerado ? TEMP_REFRIGERADO : TEMP_AMBIENTE,
      chemicalClass: quimico,
      exposedToUv: exposicaoUV,
      effectiveThresholdLog: prior.effective_threshold_log,
    });
    if (viability.verdict === 'abaixo_limiar') {
      flags.push({
        nivel: 'nogo',
        mensagem: `Viabilidade estimada abaixo do limiar apos ${horas}h.`,
        acao: 'Reduzir tempo de contato, refrigerar e evitar calor/sol antes de aplicar.',
      });
    }
  }

  // 2) Compatibilidade quimica (reusa compatibilityEngine).
  if (quimico !== 'nenhum' && organismo) {
    const compat = evaluateCompatibility({
      organisms: [organismo],
      chemicalClasses: [quimico],
      applicationMode: modo,
    });
    compat.results.forEach((res) => {
      if (res.semaphore === 'vermelho') {
        flags.push({
          nivel: 'nogo',
          mensagem: res.message,
          acao: 'Nao misturar; aplicar separado ou testar compatibilidade antes.',
        });
      } else if (res.semaphore === 'amarelo') {
        flags.push({
          nivel: 'atencao',
          mensagem: res.message,
          acao: 'Testar compatibilidade em pequena escala antes da mistura.',
        });
      }
    });
  }

  // 3) Fatores diretos do checklist (umidade / UV / refrigeracao).
  if (umidade === 'seco') {
    flags.push({
      nivel: 'atencao',
      mensagem: 'Solo seco no momento da aplicacao.',
      acao: 'Aplicar em solo umido; o estabelecimento exige umidade.',
    });
  } else if (umidade === 'encharcado') {
    flags.push({
      nivel: 'atencao',
      mensagem: 'Solo encharcado (anaerobiose).',
      acao: 'Aguardar drenagem; aerobios perdem eficacia em anaerobiose.',
    });
  }
  if (exposicaoUV) {
    flags.push({
      nivel: 'atencao',
      mensagem: 'Exposicao a sol/UV.',
      acao: 'Aplicar no fim da tarde/noite ou incorporar; cobrir o solo.',
    });
  }
  if (!refrigerado && horas >= 24) {
    flags.push({
      nivel: 'atencao',
      mensagem: `${horas}h desde a inoculacao sem refrigeracao.`,
      acao: 'Refrigerar e aplicar o quanto antes; produto vivo perece.',
    });
  }

  // Veredito agregado: o pior nivel manda.
  const temNogo = flags.some((f) => f.nivel === 'nogo');
  const temAtencao = flags.some((f) => f.nivel === 'atencao');
  const semaphore = temNogo ? 'nogo' : temAtencao ? 'atencao' : 'go';

  const limitations = [
    'Checklist de apoio (rascunho): reusa viabilityEngine e compatibilityEngine com priors nao calibrados.',
    'Nao substitui bula, registro do produto nem avaliacao tecnica responsavel.',
  ];
  if (!prior) {
    limitations.push(`Sem prior de viabilidade para "${organismo}"; tempo/temperatura/UV nao avaliados.`);
  }

  return {
    semaphore,
    flags,
    viability,
    confidence: prior ? 'baixa' : 'inconclusiva',
    limitations,
  };
}

export default assessApplication;
