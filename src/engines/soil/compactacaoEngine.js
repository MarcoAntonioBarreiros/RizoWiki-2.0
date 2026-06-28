// compactacaoEngine - interpreta a compactacao do solo (Fase S2).
//
// Densidade do solo (Ds) vs densidade critica (Dsc) por classe textural - Reichert, Reinert &
// Braida (2003), confirmado por busca independente e pelos prints do usuario. Reaproveita a classe
// de argila do motor de P (mesma classificacao CQFS). Tambem le resistencia a penetracao (RP) vs
// ~2,0 MPa, COM a ressalva de que a RP depende da umidade (modelo de Busscher) - so vale a
// capacidade de campo.
//
// Honestidade (igual a acidez): compactacao e limitacao FISICA; se restritiva, a descompactacao/
// manejo e a alavanca, o bioinsumo NAO descompacta (e secundario). Sem previsao de produtividade.
// Todos os limiares vem de compactacao_interpretation.json.
import tabela from '../../data/soil/compactacao_interpretation.json';
import { classeArgila } from './pInterpretationEngine.js';

function parseOpt(x) {
  if (x === null || x === undefined) return null;
  const s = String(x).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const ORDEM = { baixa: 0, moderada: 1, severa: 2 };
function pior(a, b) {
  if (a === null) return b;
  if (b === null) return a;
  return ORDEM[a] >= ORDEM[b] ? a : b;
}

// interpretaCompactacao({ densidade, argila, rp, origem }) -> restricao radicular + procedencia.
// densidade em g/cm3; rp em MPa; argila em % ou g/kg. origem real|prior_regional.
export function interpretaCompactacao(input = {}) {
  const { origem = 'real' } = input;
  const densidade = parseOpt(input.densidade);
  const rp = parseOpt(input.rp);
  const cls = classeArgila(input.argila);
  const out = { _source: tabela._meta._source_densidade, origem };

  if (densidade === null && rp === null) {
    return {
      ...out,
      _status: 'sem_dado',
      confidence: 'inconclusiva',
      mensagem: 'Informe densidade do solo (g/cm3) e/ou resistencia a penetracao (MPa) para avaliar compactacao.',
    };
  }

  let restricaoDs = null;
  if (densidade !== null && cls) {
    const ref = tabela.por_classe_argila[String(cls)];
    const dsc = ref.ds_critico;
    const margem = tabela.margem_atencao_ds;
    restricaoDs = densidade >= dsc ? 'severa' : densidade >= dsc - margem ? 'moderada' : 'baixa';
    out.densidade = {
      valor: densidade,
      classe_argila: cls,
      textura: ref.textura,
      ds_critico: dsc,
      ds_faixa: ref.ds_faixa,
      restricao: restricaoDs,
    };
  } else if (densidade !== null && !cls) {
    out.densidade_nota =
      'Densidade informada, mas sem o teor de argila nao da para julgar: o Dsc critico depende da textura. Informe % argila.';
  }

  let restricaoRp = null;
  if (rp !== null) {
    const r = tabela.rp;
    restricaoRp = rp >= r.severo_mpa ? 'severa' : rp >= r.critico_mpa ? 'moderada' : 'baixa';
    out.rp = {
      valor: rp,
      critico: r.critico_mpa,
      restricao: restricaoRp,
      _caveat: 'RP depende da umidade (Busscher): valida so a capacidade de campo; em solo seco a RP sobe artificialmente.',
    };
  }

  // Densidade veio mas faltou argila para julgar, e nao ha RP -> nao da para concluir.
  if (restricaoDs === null && restricaoRp === null) {
    return {
      ...out,
      _status: 'argila_ausente',
      confidence: 'inconclusiva',
      mensagem: out.densidade_nota || 'Dados insuficientes para avaliar compactacao.',
    };
  }

  const restricao = pior(restricaoDs, restricaoRp) || 'baixa';
  out.restricao = restricao;
  out.compactado = restricao !== 'baixa';

  if (out.compactado) {
    out.mensagem =
      `Indicio de compactacao (restricao ${restricao}). A descompactacao/manejo (escarificacao, plantas de ` +
      'cobertura, rotacao, trafego controlado) e a alavanca principal; o bioinsumo NAO descompacta o solo - ' +
      'e secundario e pode ter eficiencia reduzida em solo adensado.';
    out.dose_nota = tabela.dose_nota;
  } else {
    out.mensagem = 'Sem indicio de compactacao restritiva pelos dados informados.';
  }
  out.confidence = origem === 'real' ? 'media' : 'baixa';
  return out;
}

export default interpretaCompactacao;
