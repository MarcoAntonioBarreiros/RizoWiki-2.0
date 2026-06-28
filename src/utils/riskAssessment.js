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

const CATEGORY_LABEL = {
  quimico: 'Compatibilidade quimica',
  janela: 'Janela de uso',
  temperatura: 'Temperatura',
  uv: 'Sol / UV',
  umidade: 'Umidade',
};

const LEVEL_SCORE = {
  go: 0,
  atencao: 1,
  nogo: 2,
};

function makeFlag({ categoria, nivel, mensagem, acao, fonte, parametro }) {
  return { categoria, nivel, mensagem, acao, fonte, parametro };
}

function makeEvaluation({ id, categoria, parametro, valor, limite, nivel = 'go', resultado, acao = null, fonte }) {
  return {
    id,
    categoria,
    categoriaLabel: CATEGORY_LABEL[categoria] || categoria,
    parametro,
    valor,
    limite,
    nivel,
    resultado,
    acao,
    fonte,
  };
}

function worstLevel(evaluations) {
  return evaluations.reduce((worst, item) => (
    (LEVEL_SCORE[item.nivel] || 0) > (LEVEL_SCORE[worst] || 0) ? item.nivel : worst
  ), 'go');
}

function categorySummary(evaluations) {
  return Object.entries(CATEGORY_LABEL).map(([categoria, label]) => {
    const items = evaluations.filter((item) => item.categoria === categoria);
    return {
      categoria,
      label,
      nivel: items.length ? worstLevel(items) : 'go',
      count: items.filter((item) => item.nivel !== 'go').length,
    };
  });
}

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
  const evaluations = [];

  if (!lim) {
    return {
      semaphore: 'atencao',
      flags: [],
      evaluations: [],
      categories: categorySummary([]),
      score: 60,
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
      const flag = makeFlag({
        categoria: 'quimico',
        nivel: 'nogo',
        mensagem: `Incompatibilidade dura: ${quimico} inviabiliza ${nome}.`,
        acao: 'Nao misturar; aplicar separado (a fonte indica bloqueio).',
        fonte,
        parametro: 'quimico',
      });
      flags.push(flag);
      evaluations.push(makeEvaluation({
        id: 'quimico',
        categoria: 'quimico',
        parametro: 'Quimico no tanque',
        valor: quimico,
        limite: `Nao misturar com: ${incompatDuras.join(', ')}`,
        nivel: 'nogo',
        resultado: flag.mensagem,
        acao: flag.acao,
        fonte,
      }));
    } else {
      if (incompatAtencao.includes(quimico)) {
        const flag = makeFlag({
          categoria: 'quimico',
          nivel: 'atencao',
          mensagem: `${nome}: a fonte recomenda EVITAR ${quimico} (risco, nao bloqueio).`,
          acao: 'Testar compatibilidade em pequena escala; preferir aplicacao separada.',
          fonte,
          parametro: 'quimico',
        });
        flags.push(flag);
        evaluations.push(makeEvaluation({
          id: 'quimico',
          categoria: 'quimico',
          parametro: 'Quimico no tanque',
          valor: quimico,
          limite: `Evitar: ${incompatAtencao.join(', ')}`,
          nivel: 'atencao',
          resultado: flag.mensagem,
          acao: flag.acao,
          fonte,
        }));
      }
      // Regras de compatibilidade sourced para o que nao esta nos limites do organismo.
      const compat = evaluateCompatibility({
        organisms: [organismo],
        chemicalClasses: [quimico],
        applicationMode: modo,
      });
      compat.results.forEach((res) => {
        if (res.semaphore === 'vermelho' || res.semaphore === 'amarelo') {
          const flag = makeFlag({
            categoria: 'quimico',
            nivel: 'atencao',
            mensagem: res.message,
            acao: 'Testar compatibilidade antes da mistura.',
            fonte: res.source || 'compatibility_rules',
            parametro: 'quimico',
          });
          flags.push(flag);
          evaluations.push(makeEvaluation({
            id: 'compatibilidade',
            categoria: 'quimico',
            parametro: 'Compatibilidade',
            valor: quimico,
            limite: 'Regra de compatibilidade cadastrada',
            nivel: 'atencao',
            resultado: res.message,
            acao: flag.acao,
            fonte: flag.fonte,
          }));
        }
      });
    }
  } else {
    evaluations.push(makeEvaluation({
      id: 'quimico',
      categoria: 'quimico',
      parametro: 'Quimico no tanque',
      valor: 'nenhum',
      limite: incompatDuras.length || incompatAtencao.length
        ? `Evitar/manejar: ${[...incompatDuras, ...incompatAtencao].join(', ')}`
        : 'Sem incompatibilidade especifica documentada',
      resultado: 'Sem alerta quimico para o caso informado.',
      fonte,
    }));
  }
  if (!evaluations.some((item) => item.categoria === 'quimico')) {
    evaluations.push(makeEvaluation({
      id: 'quimico',
      categoria: 'quimico',
      parametro: 'Quimico no tanque',
      valor: quimico,
      limite: incompatDuras.length || incompatAtencao.length
        ? `Evitar/manejar: ${[...incompatDuras, ...incompatAtencao].join(', ')}`
        : 'Sem incompatibilidade especifica documentada',
      resultado: 'Sem alerta quimico para o caso informado.',
      fonte,
    }));
  }

  // --- Janela de uso (BRANDA: acao = reinocular) ---
  if (lim.janela_uso_h && horas > lim.janela_uso_h) {
    const flag = makeFlag({
      categoria: 'janela',
      nivel: 'atencao',
      mensagem: `Passou da janela de ${lim.janela_uso_h} h desde a inoculacao (${horas} h).`,
      acao: lim.janela_acao === 'reinocular' ? 'Reinocular antes de aplicar.' : 'Reduzir o tempo ate a aplicacao.',
      fonte,
      parametro: 'horas',
    });
    flags.push(flag);
    evaluations.push(makeEvaluation({
      id: 'janela',
      categoria: 'janela',
      parametro: 'Tempo desde inoculacao',
      valor: `${horas} h`,
      limite: `ate ${lim.janela_uso_h} h`,
      nivel: 'atencao',
      resultado: flag.mensagem,
      acao: flag.acao,
      fonte,
    }));
  } else {
    evaluations.push(makeEvaluation({
      id: 'janela',
      categoria: 'janela',
      parametro: 'Tempo desde inoculacao',
      valor: `${horas} h`,
      limite: lim.janela_uso_h ? `ate ${lim.janela_uso_h} h` : 'Sem janela documentada',
      resultado: lim.janela_uso_h ? 'Dentro da janela operacional informada.' : 'Sem limite de tempo documentado para este organismo.',
      fonte,
    }));
  }

  // --- Temperatura de APLICACAO (letal/ar). Armazenamento e PRATELEIRA -> vira nota, nao flag. ---
  const tempAtual = refrigerado ? 8 : TEMP_AMBIENTE_C;
  if (lim.temp_letal_c && tempAtual >= lim.temp_letal_c) {
    const flag = makeFlag({
      categoria: 'temperatura',
      nivel: 'nogo',
      mensagem: `Temperatura >= ${lim.temp_letal_c} C: a fonte indica que o calor mata as celulas.`,
      acao: 'Resfriar antes de aplicar.',
      fonte,
      parametro: 'temperatura',
    });
    flags.push(flag);
    evaluations.push(makeEvaluation({
      id: 'temperatura',
      categoria: 'temperatura',
      parametro: 'Temperatura assumida',
      valor: `${tempAtual} C`,
      limite: `< ${lim.temp_letal_c} C`,
      nivel: 'nogo',
      resultado: flag.mensagem,
      acao: flag.acao,
      fonte,
    }));
  } else if (lim.temp_ar_max_c && tempAtual > lim.temp_ar_max_c) {
    const flag = makeFlag({
      categoria: 'temperatura',
      nivel: 'atencao',
      mensagem: `Temperatura do ar acima de ${lim.temp_ar_max_c} C na aplicacao.`,
      acao: 'Aplicar em horario mais fresco (manha/fim de tarde).',
      fonte,
      parametro: 'temperatura',
    });
    flags.push(flag);
    evaluations.push(makeEvaluation({
      id: 'temperatura',
      categoria: 'temperatura',
      parametro: 'Temperatura assumida',
      valor: `${tempAtual} C`,
      limite: `ar ate ${lim.temp_ar_max_c} C`,
      nivel: 'atencao',
      resultado: flag.mensagem,
      acao: flag.acao,
      fonte,
    }));
  } else {
    const tempLimit = lim.temp_letal_c
      ? `< ${lim.temp_letal_c} C`
      : lim.temp_ar_max_c
        ? `ar ate ${lim.temp_ar_max_c} C`
        : 'Sem limite de aplicacao documentado';
    evaluations.push(makeEvaluation({
      id: 'temperatura',
      categoria: 'temperatura',
      parametro: refrigerado ? 'Temperatura refrigerada assumida' : 'Temperatura ambiente assumida',
      valor: `${tempAtual} C`,
      limite: tempLimit,
      resultado: 'Sem alerta de temperatura para o caso informado.',
      fonte,
    }));
  }

  // --- UV / horario (so se a fonte exige) ---
  if (lim.uv_exige_horario && exposicaoUV) {
    const flag = makeFlag({
      categoria: 'uv',
      nivel: 'atencao',
      mensagem: 'Exposicao a sol/UV: a fonte pede janela de aplicacao.',
      acao: 'Aplicar de manha cedo ou no fim da tarde; cobrir o solo.',
      fonte,
      parametro: 'exposicaoUV',
    });
    flags.push(flag);
    evaluations.push(makeEvaluation({
      id: 'uv',
      categoria: 'uv',
      parametro: 'Exposicao a sol/UV',
      valor: 'sim',
      limite: 'evitar sol/UV direto',
      nivel: 'atencao',
      resultado: flag.mensagem,
      acao: flag.acao,
      fonte,
    }));
  } else {
    evaluations.push(makeEvaluation({
      id: 'uv',
      categoria: 'uv',
      parametro: 'Exposicao a sol/UV',
      valor: exposicaoUV ? 'sim' : 'nao',
      limite: lim.uv_exige_horario ? 'evitar sol/UV direto' : (lim.obs_uv || 'Sem restricao dura documentada'),
      resultado: lim.uv_exige_horario
        ? 'Sem alerta porque a exposicao UV nao foi marcada.'
        : 'Sem alerta de UV para este organismo no limite atual.',
      fonte,
    }));
  }

  // --- Umidade ---
  if (umidade === 'seco') {
    const exigeUmidade = lim.umidade_min_pct ? ` (a fonte cita > ${lim.umidade_min_pct}% UR)` : '';
    const flag = makeFlag({
      categoria: 'umidade',
      nivel: 'atencao',
      mensagem: `Solo/ambiente seco${exigeUmidade}.`,
      acao: 'Aplicar em solo umido; o estabelecimento exige umidade.',
      fonte: lim.umidade_min_pct ? fonte : 'manejo geral',
      parametro: 'umidade',
    });
    flags.push(flag);
    evaluations.push(makeEvaluation({
      id: 'umidade',
      categoria: 'umidade',
      parametro: 'Umidade do solo/ambiente',
      valor: 'seco',
      limite: lim.umidade_min_pct ? `UR > ${lim.umidade_min_pct}%` : 'solo umido',
      nivel: 'atencao',
      resultado: flag.mensagem,
      acao: flag.acao,
      fonte: flag.fonte,
    }));
  } else if (umidade === 'encharcado') {
    const flag = makeFlag({
      categoria: 'umidade',
      nivel: 'atencao',
      mensagem: 'Solo encharcado (anaerobiose).',
      acao: 'Aguardar drenagem; aerobios perdem eficacia em anaerobiose.',
      fonte: 'manejo geral',
      parametro: 'umidade',
    });
    flags.push(flag);
    evaluations.push(makeEvaluation({
      id: 'umidade',
      categoria: 'umidade',
      parametro: 'Umidade do solo/ambiente',
      valor: 'encharcado',
      limite: 'solo umido, sem anaerobiose',
      nivel: 'atencao',
      resultado: flag.mensagem,
      acao: flag.acao,
      fonte: flag.fonte,
    }));
  } else {
    evaluations.push(makeEvaluation({
      id: 'umidade',
      categoria: 'umidade',
      parametro: 'Umidade do solo/ambiente',
      valor: 'adequado',
      limite: lim.umidade_min_pct ? `UR > ${lim.umidade_min_pct}%` : 'solo umido',
      resultado: 'Umidade adequada para estabelecimento operacional.',
      fonte: lim.umidade_min_pct ? fonte : 'manejo geral',
    }));
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
  if (lim.temp_armazenamento_max_c) {
    limitations.push(`Armazenar ate ${lim.temp_armazenamento_max_c} C (prateleira, nao impede aplicacao) [${fonte}].`);
  }

  const confidence = lim._status === 'calibrado_parcial' ? 'media' : 'baixa';
  const penalty = flags.reduce((total, flag) => total + (flag.nivel === 'nogo' ? 55 : 18), 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    semaphore,
    flags,
    evaluations,
    categories: categorySummary(evaluations),
    score,
    confidence,
    limitations,
  };
}

export default assessApplication;
