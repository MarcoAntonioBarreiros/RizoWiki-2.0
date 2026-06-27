// soilContext - modelo unico do contexto de solo com DEGRADACAO GRACIOSA (plano Fase S1).
//
// Principio (definido pelo usuario): UM modelo so. Roda com o que o usuario tiver; o dado REAL
// sobrescreve o PRIOR regional, campo a campo, e a ORIGEM e sempre rastreada
// (real | prior_regional | ausente). Sem analise = roda 100% com priors (modelo generico);
// com analise = os reais substituem os priors. Nao exige minimo de dados.
//
// Refinamentos (revisao GPT):
// - REGIAO explicita: default 'sul_pr', mas a suposicao tem que APARECER (regiao_aviso).
// - Confianca MULTIFATORIAL: nao sobe so por completude; pesa os campos DECISIVOS reais + regiao.
//
// INTEGRIDADE: priors regionais sao ASSUMIDOS e rotulados (a refinar com CQFS-RS/SC, IAPAR);
// nunca apresentados como a analise do usuario nem como medida.
import priors from '../../data/soil/priors_regionais.json';

export const SOIL_FIELDS = ['P', 'pH', 'V', 'Al', 'CTC', 'argila', 'densidade'];

// Campos decisivos por eixo de interpretacao (usados na confianca multifatorial).
export const CAMPOS_DECISIVOS = {
  fosforo: ['P', 'argila'],
  acidez: ['pH', 'V', 'Al'],
  compactacao: ['densidade'],
};

const REGIAO_DEFAULT = 'sul_pr';

function temValor(v) {
  return v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v));
}

export function resolveSoilContext(input = {}) {
  const regiaoId = input.regiao || REGIAO_DEFAULT;
  const reg = priors.regioes[regiaoId] || priors.regioes[REGIAO_DEFAULT];
  const regiaoInformada = !!input.regiao;

  const campos = {};
  let reais = 0;
  for (const f of SOIL_FIELDS) {
    if (temValor(input[f])) {
      campos[f] = { valor: Number(input[f]), origem: 'real', _source: 'analise do usuario' };
      reais += 1;
    } else if (reg.defaults && temValor(reg.defaults[f])) {
      campos[f] = { valor: reg.defaults[f], origem: 'prior_regional', _source: reg._source };
    } else {
      campos[f] = { valor: null, origem: 'ausente', _source: null };
    }
  }

  return {
    regiao: regiaoId,
    regiao_label: reg._label,
    regiao_origem: regiaoInformada ? 'informada' : 'assumida_default',
    regiao_aviso: regiaoInformada
      ? null
      : `Regiao nao informada; assumido '${reg._label}'. Sem regiao real, a confianca cai.`,
    campos,
    campos_reais: reais,
    campos_total: SOIL_FIELDS.length,
    completude: Math.round((reais / SOIL_FIELDS.length) * 100) / 100,
  };
}

// Confianca para uma recomendacao cujos campos DECISIVOS sao `decisivos`.
// Regra (revisao GPT): nao sobe so por completude; exige os decisivos REAIS (e regiao real) p/ media.
export function soilConfidence(resolved, decisivos = []) {
  if (!decisivos.length) return 'baixa';
  const todosDecisivosReais = decisivos.every((f) => resolved.campos[f]?.origem === 'real');
  const regiaoOk = resolved.regiao_origem === 'informada';
  if (todosDecisivosReais && regiaoOk) return 'media';
  return 'baixa';
}

export default resolveSoilContext;
