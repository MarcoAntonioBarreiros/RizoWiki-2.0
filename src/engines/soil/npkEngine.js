// npkEngine - recomendacao QUALITATIVA de NPK por classe (CQFS-RS/SC 2016). Fase NPK (base mineral).
//
// Decisao do usuario: por ora NAO cravar dose em kg/ha (a tabela de dose 2016 nao esta disponivel
// livremente; ed. 2004 nao deve ser usada). A partir da CLASSE sourced de P e K, diz se e caso de
// CORRIGIR (abaixo do critico), REPOR (faixa adequada) ou DISPENSAR (acima). Para N, aplica a
// honestidade que liga ao RizoWiki: em soja/leguminosa o N vem da FIXACAO BIOLOGICA (inocular, nao
// aplicar N mineral - aqui o bioinsumo E a alavanca); em graminea o N e mineral por rendimento e o
// bioinsumo so complementa.
import { classificaCultura } from '../diagnosticEngine.js';

const FONTE =
  'CQFS-RS/SC 2016 (interpretacao por classe). DOSE em kg/ha pendente (tabela de dose 2016 nao disponivel livremente).';

// Acoes por classe de disponibilidade (mesma logica p/ P e K): abaixo do critico -> corrigir;
// faixa Alto (= teor critico) -> repor/manutencao; Muito alto -> dispensar.
const REC_PK = {
  muito_baixo: { acao: 'corrigir', resposta: 'alta', texto: 'muito abaixo do critico: adubacao corretiva (elevar ao nivel critico) + reposicao; resposta esperada alta.' },
  baixo: { acao: 'corrigir', resposta: 'provavel', texto: 'abaixo do critico: corretiva + reposicao; resposta provavel.' },
  medio: { acao: 'corrigir_parcial', resposta: 'media', texto: 'ainda abaixo do critico (faixa Medio): reposicao + correcao gradual.' },
  alto: { acao: 'repor', resposta: 'baixa', texto: 'faixa adequada (Alto = teor critico): adubacao de reposicao/manutencao pela exportacao da cultura.' },
  muito_alto: { acao: 'dispensar', resposta: 'nula', texto: 'acima do critico: pode dispensar na safra (so manutencao minima); excesso traz risco ambiental.' },
};

function recNutrientePorClasse(nutriente, classe) {
  if (!classe) {
    return { nutriente, classe: null, acao: 'sem_dado', texto: `${nutriente}: informe o valor e a textura/CTC para classificar.` };
  }
  const r = REC_PK[classe];
  if (!r) {
    return { nutriente, classe, acao: 'avaliar', texto: `${nutriente}: classe ${classe} nao reconhecida.` };
  }
  return { nutriente, classe, acao: r.acao, resposta: r.resposta, texto: `${nutriente} (${classe}): ${r.texto}` };
}

function recN(cultura) {
  const grupo = classificaCultura(cultura);
  if (grupo === 'leguminosa') {
    return {
      nutriente: 'N',
      grupo,
      via: 'fixacao_biologica',
      acao: 'inocular',
      bioinsumo_alavanca: true,
      texto: 'N: suprido por fixacao biologica (FBN) - NAO recomendar N mineral em soja/leguminosa. Inocular com Bradyrhizobium (co-inoculacao com Azospirillum amplia). Aqui o BIOINSUMO e a alavanca de N.',
    };
  }
  if (grupo === 'graminea') {
    return {
      nutriente: 'N',
      grupo,
      via: 'mineral',
      acao: 'aplicar_por_rendimento',
      bioinsumo_alavanca: false,
      texto: 'N: mineral, por expectativa de rendimento e MO/cultura anterior (dose kg/ha pendente, tabela CQFS 2016). Azospirillum COMPLEMENTA, nao substitui o N mineral em graminea.',
    };
  }
  return {
    nutriente: 'N',
    grupo,
    via: 'depende',
    acao: 'avaliar',
    bioinsumo_alavanca: null,
    texto: 'N: depende da cultura (leguminosa = FBN/inocular; graminea = mineral por rendimento).',
  };
}

// recomendaNpk({ cultura, pClasse, kClasse }) - pClasse/kClasse sao as classes de 5 niveis dos
// motores de P e K (muito_baixo..muito_alto). Saida qualitativa, advisory e citada.
export function recomendaNpk(input = {}) {
  const { pClasse, kClasse, cultura } = input;
  return {
    N: recN(cultura),
    P: recNutrientePorClasse('P', pClasse),
    K: recNutrientePorClasse('K', kClasse),
    _source: FONTE,
    nota: 'Recomendacao QUALITATIVA por classe (advisory): corrigir / repor / dispensar. NAO crava dose nem substitui recomendacao tecnica por laudo.',
  };
}

export default recomendaNpk;
