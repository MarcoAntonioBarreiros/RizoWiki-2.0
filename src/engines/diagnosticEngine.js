// diagnosticEngine - versao leve por regras explicaveis (brief secoes 4, 6 e 11).
//
// Entrada: { cultura, estadio, problema, pClasse, umidade }
// Saida:   { limitacaoProvavel, funcoesPrioritarias, organismosCandidatos,
//            bioinsumoEhAlavancaPrincipal, message, confidence, limitations }
//
// INTEGRIDADE (AGENTS.md 3-6): regras qualitativas marcadas como rascunho.
// Nao inventa constante cientifica nem dose. Os ids de organismo seguem os de
// compatibility_rules.json. O mapa problema -> funcoes -> organismos e qualitativo
// (perfil didatico do 1.0), confidence baixa, pendente de curadoria com crop_rules.json
// e fontes regionais (manuais de fertilidade do Sul/PR).

export const PROBLEMAS = {
  fosforo_indisponivel: {
    label: 'Fosforo travado / baixa disponibilidade de P',
    limitacao: 'Fosforo presente porem pouco disponivel (fixado no solo).',
    funcoes: ['solubilizacao_p', 'micorriza_p'],
    candidatos: ['bacillus', 'pseudomonas', 'micorrizas'],
    bioinsumoPrincipal: true,
  },
  doenca_solo: {
    label: 'Doenca de solo (podridoes, murchas, damping-off)',
    limitacao: 'Pressao de patogenos de solo sobre a raiz.',
    funcoes: ['biocontrole', 'isr'],
    candidatos: ['trichoderma', 'bacillus', 'pseudomonas'],
    bioinsumoPrincipal: true,
  },
  estresse_hidrico: {
    label: 'Estresse hidrico / calor',
    limitacao: 'Deficit hidrico ou calor limitando o desenvolvimento.',
    funcoes: ['promocao_radicular', 'acc_desaminase'],
    candidatos: ['fixadores', 'bacillus', 'micorrizas'],
    bioinsumoPrincipal: true,
  },
  baixa_fixacao_n: {
    label: 'Necessidade de nitrogenio / fixacao biologica',
    limitacao: 'Suprimento de N dependente de fixacao biologica.',
    funcoes: ['fixacao_n'],
    candidatos: ['rhizobium', 'fixadores'],
    bioinsumoPrincipal: true,
  },
  enraizamento_fraco: {
    label: 'Enraizamento fraco / vigor inicial',
    limitacao: 'Sistema radicular pouco desenvolvido.',
    funcoes: ['promocao_radicular'],
    candidatos: ['fixadores', 'pseudomonas'],
    bioinsumoPrincipal: true,
  },
  salinidade: {
    label: 'Salinidade / recuperacao de solo',
    limitacao: 'Estresse salino e solo degradado.',
    funcoes: ['biofilme', 'tolerancia_estresse'],
    candidatos: ['pnsb', 'bacillus'],
    bioinsumoPrincipal: true,
  },
  acidez_fertilidade: {
    label: 'Acidez / baixa fertilidade de base',
    limitacao: 'Limitacao quimica de base (acidez, fertilidade insuficiente).',
    funcoes: [],
    candidatos: [],
    bioinsumoPrincipal: false,
  },
};

const LEGUMINOSAS = ['soja', 'feijao', 'ervilha', 'amendoim', 'grao de bico', 'lentilha'];
const GRAMINEAS = ['milho', 'trigo', 'arroz', 'sorgo', 'cana', 'pastagem', 'aveia', 'cevada'];

export function classificaCultura(cultura) {
  const c = String(cultura || '').trim().toLowerCase();
  if (LEGUMINOSAS.includes(c)) return 'leguminosa';
  if (GRAMINEAS.includes(c)) return 'graminea';
  return 'outra';
}

const DISCLAIMER_LIMIT =
  'Diagnostico por regras explicaveis (rascunho); nao substitui analise de solo, ' +
  'bula nem avaliacao tecnica responsavel.';

function refinaCandidatosFixacao(grupoCultura) {
  if (grupoCultura === 'leguminosa') return ['rhizobium'];
  if (grupoCultura === 'graminea') return ['fixadores'];
  return ['rhizobium', 'fixadores'];
}

export function runDiagnosis(input = {}) {
  const { cultura, problema, pClasse, umidade } = input;
  const limitations = [DISCLAIMER_LIMIT];

  const regra = PROBLEMAS[problema];
  if (!regra) {
    return {
      limitacaoProvavel: null,
      funcoesPrioritarias: [],
      organismosCandidatos: [],
      bioinsumoEhAlavancaPrincipal: null,
      message:
        'Informe um problema reconhecido para gerar o diagnostico (' +
        Object.keys(PROBLEMAS).join(', ') + ').',
      confidence: 'inconclusiva',
      limitations,
    };
  }

  const grupoCultura = classificaCultura(cultura);
  let candidatos = regra.candidatos.slice();
  if (problema === 'baixa_fixacao_n') {
    candidatos = refinaCandidatosFixacao(grupoCultura);
  }

  const bioinsumoPrincipal = regra.bioinsumoPrincipal;
  let message;

  if (!bioinsumoPrincipal) {
    // Honestidade agronomica obrigatoria (brief secao 4): se a limitacao real e de
    // fertilidade/acidez/manejo basico, dizer que bioinsumo nao e a alavanca principal.
    message =
      'Bioinsumo nao e a alavanca principal aqui: a limitacao provavel e de base ' +
      '(acidez/fertilidade). Corrigir acidez e fertilidade primeiro; o bioinsumo entra ' +
      'como complemento, nao como solucao isolada.';
  } else {
    message =
      'Limitacao provavel: ' + regra.limitacao +
      ' Funcoes microbianas prioritarias: ' + (regra.funcoes.join(', ') || 'n/d') + '.';
  }

  // Sinal de fertilidade que rebaixa o protagonismo do bioinsumo (sem cravar numero).
  if (pClasse === 'baixo' && problema === 'fosforo_indisponivel') {
    limitations.push(
      'P classe baixo: havendo deficiencia real de P, a adubacao/correcao e a alavanca ' +
      'principal; o bioinsumo atua na eficiencia, nao a substitui.',
    );
  }

  // Efeitos de umidade no estabelecimento.
  if (umidade === 'encharcado') {
    limitations.push('Solo encharcado (anaerobiose) reduz eficacia de aerobios; rever drenagem.');
  } else if (umidade === 'seco') {
    limitations.push('Estabelecimento exige umidade; em solo seco o ganho tende a cair.');
  }

  return {
    limitacaoProvavel: regra.limitacao,
    funcoesPrioritarias: regra.funcoes.slice(),
    organismosCandidatos: candidatos,
    bioinsumoEhAlavancaPrincipal: bioinsumoPrincipal,
    message,
    confidence: 'baixa',
    limitations,
  };
}

export default runDiagnosis;
