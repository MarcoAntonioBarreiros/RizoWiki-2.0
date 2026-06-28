// acidezEngine - interpreta a acidez do solo pela tabela citada do CQFS-RS/SC 2016 (Fase S2).
//
// Le pH em agua, saturacao por bases (V%) e saturacao por aluminio (m%) e classifica cada um
// pela Tabela 5.1 do manual. CUIDADO (destacado pelo proprio manual): a direcao de QUALIDADE
// difere por indicador - pH e V% sao "maior = melhor"; m% (Al) e "maior = PIOR" (toxidez). O
// motor trata isso explicitamente; nao trata "Alto" como bom para os tres.
//
// Saida tambem aplica a honestidade agronomica do projeto: se a acidez e limitante, a CALAGEM e
// a alavanca principal e o bioinsumo entra como complemento. NAO calcula dose de calcario (Indice
// SMP/PRNT e fase posterior). Todos os limiares vem de acidez_interpretation.json (lido do PDF).
//
// NOTA p/ R1: esta tabela usa SATURACAO por Al (m%), nao o Al trocavel (cmolc) do soilContext.
// A reconciliacao de campos (adicionar m% ao soilContext) fica para a fiacao R1.
import tabela from '../../data/soil/acidez_interpretation.json';

// Parse de numero opcional de formulario: '', null, undefined, espaco ou nao-numero -> null.
// (Number('') === 0, por isso nao da pra usar Number.isFinite direto em entradas vazias.)
function num(x) {
  if (x === null || x === undefined) return null;
  const s = String(x).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function rotulo(indicador, classe) {
  const b = tabela[indicador].bandas.find((x) => x.classe === classe);
  return b ? b.rotulo : null;
}

// pH em agua (maior = melhor). Limites [5.0, 5.4, 6.0], comparacao <= (bandas contiguas).
function classPH(v) {
  const [a, b, c] = tabela.ph_agua._limites;
  if (v <= a) return 'muito_baixo';
  if (v <= b) return 'baixo';
  if (v <= c) return 'medio';
  return 'alto';
}

// Saturacao por bases V% (maior = melhor). Limites [45, 65, 80]: muito_baixo <45, baixo 45-64,
// medio 65-80, alto >80.
function classV(v) {
  const [a, b, c] = tabela.saturacao_bases_v._limites;
  if (v < a) return 'muito_baixo';
  if (v < b) return 'baixo';
  if (v <= c) return 'medio';
  return 'alto';
}

// Saturacao por aluminio m% (maior = PIOR). Limites [1, 10, 20]: muito_baixo <1, baixo 1-10,
// medio 10,1-20, alto >20.
function classM(v) {
  const [a, b, c] = tabela.saturacao_aluminio_m._limites;
  if (v < a) return 'muito_baixo';
  if (v <= b) return 'baixo';
  if (v <= c) return 'medio';
  return 'alto';
}

// interpretaAcidez({ pH, V, m, origem }) -> classes + necessidade de calagem + procedencia.
// V = saturacao por bases (%); m = saturacao por aluminio (%). origem real|prior_regional.
export function interpretaAcidez(input = {}) {
  const { origem = 'real' } = input;
  const pH = num(input.pH);
  const V = num(input.V);
  const m = num(input.m);
  const out = { _source: tabela._meta._source, origem };

  if (pH === null && V === null && m === null) {
    return {
      ...out,
      _status: 'sem_dado',
      confidence: 'inconclusiva',
      mensagem: 'Informe pH, V% ou saturacao por Al (m%) para interpretar a acidez.',
    };
  }

  if (pH !== null) {
    const c = classPH(pH);
    out.pH = { valor: pH, classe: c, rotulo: rotulo('ph_agua', c) };
  }
  if (V !== null) {
    const c = classV(V);
    out.V = { valor: V, classe: c, rotulo: rotulo('saturacao_bases_v', c) };
  }
  if (m !== null) {
    const c = classM(m);
    const banda = tabela.saturacao_aluminio_m.bandas.find((x) => x.classe === c);
    out.m = { valor: m, classe: c, rotulo: banda.rotulo, toxidez: banda.toxidez };
  }

  const g = tabela.calagem;
  const motivos = [];
  if (pH !== null && pH < g.gatilho_ph) motivos.push(`pH ${pH} < ${g.gatilho_ph}`);
  if (V !== null && V < g.gatilho_v_min) motivos.push(`V ${V}% < ${g.gatilho_v_min}%`);
  if (m !== null && m > g.gatilho_m_max) motivos.push(`saturacao Al ${m}% > ${g.gatilho_m_max}%`);
  out.calagem_indicada = motivos.length > 0;
  out.calagem_motivos = motivos;
  out._fonte_calagem = g._source;

  // Acidez como limitacao PRINCIPAL (bioinsumo e complemento) - mesma honestidade do diagnosticEngine.
  const acidezForte =
    (out.pH && (out.pH.classe === 'muito_baixo' || out.pH.classe === 'baixo')) ||
    (out.m && (out.m.toxidez === 'moderada' || out.m.toxidez === 'alta')) ||
    (out.V && out.V.classe === 'muito_baixo');
  out.acidez_limitante = !!acidezForte;

  out.mensagem = out.calagem_indicada
    ? `Acidez indica calagem (${motivos.join('; ')}). A correcao da acidez e a alavanca principal; ` +
      'o bioinsumo entra como complemento, nao como solucao isolada. A dose de calcario (Indice ' +
      'SMP/PRNT) e etapa posterior.'
    : 'Acidez dentro de faixa adequada pelos indicadores informados; calagem nao indicada por estes dados.';
  out.confidence = origem === 'real' ? 'media' : 'baixa';
  return out;
}

export default interpretaAcidez;
