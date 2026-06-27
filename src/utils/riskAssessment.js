// riskAssessment - aba Fatores: veredito go/atencao/no-go por LIMITES OPERACIONAIS com fonte.
//
// Fase V1 (reframe): a decisao de viabilidade vem dos `limites_operacionais` SOURCED de cada
// organismo (organisms.json) - NAO da cinetica inventada do viabilityEngine.
// Regra (revisao GPT): BLOQUEIO (nogo) so quando a fonte e DURA (incompat_duras / temp letal);
// fontes brandas (incompat_atencao, janela 24h -> reinocular, UV, umidade, armazenamento) viram
// RISCO ALTO (atencao). Reusa compatibilityEngine para classes nao cobertas pelos limites.
// Cada flag cita a FONTE.
import organismsData from '../data/organisms.json';
import { evaluateCompatibility } from '../engines/compatibilityEngine.js';

const TEMP_AMBIENTE_C = 30; // temperatura assumida quando nao refrigerado (checklist simplificado).

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

  const org = organismsData.organisms[organismo];
  const lim = org?.limites_operacionais;
  const flags = [];

  if (!lim) {
    return {
      semaphore: 'atencao',
      flags: [],
      confidence: 'inconclusiva',
      limitations: [`Sem limites operacionais documentados para "${organismo}".`],
    };
  }

  const nome = org.label || organismo;
  const fonte = lim._source || 'fonte nao especificada';
  const incompatDuras = lim.incompat_duras || [];
  const incompatAtencao = lim.incompat_atencao || [];

  // --- Quimico: bloqueio so quando a fonte e dura; senao risco alto ---
  if (quimico !== 'nenhum') {
    if (incompatDuras.includes(quimico)) {
      flags.push({
        nivel: 'nogo',
        mensagem: `Incompatibilidade dura: ${quimico} inviabiliza ${nome}.`,
        acao: 'Nao misturar; aplicar separado (a fonte indica bloqueio).',
        fonte,
      });
    } else {
      if (incompatAtencao.includes(quimico)) {
        flags.push({
          nivel: 'atencao',
          mensagem: `${nome}: a fonte recomenda EVITAR ${quimico} (risco, nao bloqueio).`,
          acao: 'Testar compatibilidade em pequena escala; preferir aplicacao separada.',
          fonte,
        });
      }
      // Regras de compatibilidade sourced para o que nao esta nos limites do organismo.
      const compat = evaluateCompatibility({
        organisms: [organismo],
        chemicalClasses: [quimico],
        applicationMode: modo,
      });
      compat.results.forEach((res) => {
        if (res.semaphore === 'vermelho' || res.semaphore === 'amarelo') {
          flags.push({
            nivel: 'atencao',
            mensagem: res.message,
            acao: 'Testar compatibilidade antes da mistura.',
            fonte: res.source || 'compatibility_rules',
          });
        }
      });
    }
  }

  // --- Janela de uso (BRANDA: acao = reinocular) ---
  if (lim.janela_uso_h && horas > lim.janela_uso_h) {
    flags.push({
      nivel: 'atencao',
      mensagem: `Passou da janela de ${lim.janela_uso_h} h desde a inoculacao (${horas} h).`,
      acao: lim.janela_acao === 'reinocular' ? 'Reinocular antes de aplicar.' : 'Reduzir o tempo ate a aplicacao.',
      fonte,
    });
  }

  // --- Temperatura ---
  const tempAtual = refrigerado ? 8 : TEMP_AMBIENTE_C;
  if (lim.temp_letal_c && tempAtual >= lim.temp_letal_c) {
    flags.push({
      nivel: 'nogo',
      mensagem: `Temperatura >= ${lim.temp_letal_c} C: a fonte indica que o calor mata as celulas.`,
      acao: 'Resfriar antes de aplicar.',
      fonte,
    });
  } else if (lim.temp_armazenamento_max_c && !refrigerado && tempAtual > lim.temp_armazenamento_max_c) {
    flags.push({
      nivel: 'atencao',
      mensagem: `Manter ate ${lim.temp_armazenamento_max_c} C (ambiente estimado ${tempAtual} C).`,
      acao: 'Refrigerar / proteger do calor.',
      fonte,
    });
  }

  // --- UV / horario (so se a fonte exige) ---
  if (lim.uv_exige_horario && exposicaoUV) {
    flags.push({
      nivel: 'atencao',
      mensagem: 'Exposicao a sol/UV: a fonte pede janela de aplicacao.',
      acao: 'Aplicar de manha cedo ou no fim da tarde; cobrir o solo.',
      fonte,
    });
  }

  // --- Umidade ---
  if (umidade === 'seco') {
    const exigeUmidade = lim.umidade_min_pct ? ` (a fonte cita > ${lim.umidade_min_pct}% UR)` : '';
    flags.push({
      nivel: 'atencao',
      mensagem: `Solo/ambiente seco${exigeUmidade}.`,
      acao: 'Aplicar em solo umido; o estabelecimento exige umidade.',
      fonte: lim.umidade_min_pct ? fonte : 'manejo geral',
    });
  } else if (umidade === 'encharcado') {
    flags.push({
      nivel: 'atencao',
      mensagem: 'Solo encharcado (anaerobiose).',
      acao: 'Aguardar drenagem; aerobios perdem eficacia em anaerobiose.',
      fonte: 'manejo geral',
    });
  }

  // Veredito: o pior nivel manda.
  const temNogo = flags.some((f) => f.nivel === 'nogo');
  const temAtencao = flags.some((f) => f.nivel === 'atencao');
  const semaphore = temNogo ? 'nogo' : temAtencao ? 'atencao' : 'go';

  const limitations = [
    'Veredito por LIMITES OPERACIONAIS com fonte (Fase V1): bloqueio so quando a fonte e dura; o resto e risco.',
    'Nao substitui bula, registro do produto nem avaliacao tecnica responsavel.',
  ];
  if (lim.forma_resiliente) {
    limitations.push(`${nome} e esporulado/resiliente: tolera mais estresse operacional [${fonte}].`);
  }
  if (lim._escopo) {
    limitations.push(`Escopo dos limites: ${lim._escopo}.`);
  }

  const confidence = lim._status === 'calibrado_parcial' ? 'media' : 'baixa';

  return { semaphore, flags, confidence, limitations };
}

export default assessApplication;
