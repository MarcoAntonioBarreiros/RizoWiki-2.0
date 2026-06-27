// pInterpretationEngine - interpreta o P REAL do usuario pela tabela citada do CQFS-RS/SC 2016
// (Fase S2). Substitui o antigo dropdown manual "P baixo/medio/alto": agora o usuario informa o
// NUMERO (mg/dm3) + extrator + % argila, e a classe sai da tabela oficial - mudando com a argila
// e com o grupo de cultura (sequeiro/graos vs frutiferas), exatamente como o manual prescreve.
//
// INTEGRIDADE: todos os limiares vem de p_interpretation.json (CQFS-RS/SC 2016, lido do PDF).
// Nada inventado. Sem o dado (valor ou argila) -> nao classifica e diz o que falta (honesto).
import tabela from '../../data/soil/p_interpretation.json';

const FRUTIFERAS = [
  'nogueira', 'noz', 'peca', 'maca', 'macieira', 'citros', 'laranja', 'uva', 'videira',
  'pessego', 'pera', 'ameixa', 'caqui', 'frutifera',
];

// Grupo de tabela por cultura. Default: sequeiro (graos), que cobre as culturas-foco
// do RizoWiki (soja, milho, trigo...). So vira 'frutiferas' para fruteiras perenes.
export function grupoCulturaP(cultura) {
  const c = String(cultura || '').trim().toLowerCase();
  if (FRUTIFERAS.some((f) => c.includes(f))) return 'frutiferas';
  return 'sequeiro';
}

// Aceita argila em % (0-100) ou g/kg (>100, convertido /10), padrao dos laudos BR.
export function argilaParaPct(argila) {
  const a = Number(argila);
  if (!Number.isFinite(a)) return null;
  return a > 100 ? a / 10 : a;
}

// Classe de teor de argila (CQFS Tabela 5.2): 1 (>60%), 2 (41-60), 3 (21-40), 4 (<=20).
export function classeArgila(argila) {
  const pct = argilaParaPct(argila);
  if (pct == null) return null;
  if (pct <= 20) return 4;
  if (pct <= 40) return 3;
  if (pct <= 60) return 2;
  return 1;
}

function classificaPorFaixas(v, f) {
  if (v <= f.muito_baixo_max) return 'muito_baixo';
  if (v <= f.baixo_max) return 'baixo';
  if (v <= f.medio_max) return 'medio';
  if (v <= f.alto_max) return 'alto';
  return 'muito_alto';
}

// Ponte para o vocabulario pClasse (baixo/medio/alto) que o diagnosticEngine ja consome.
// Agrupa as 5 classes do CQFS nas 3 do motor de diagnostico.
export function paraPClasse(classeCQFS) {
  if (classeCQFS === 'muito_baixo' || classeCQFS === 'baixo') return 'baixo';
  if (classeCQFS === 'medio') return 'medio';
  if (classeCQFS === 'alto' || classeCQFS === 'muito_alto') return 'alto';
  return null;
}

// interpretaP({ valor, extrator, argila, cultura, origem }) -> classe + critico + procedencia.
// origem: 'real' (analise do usuario) ou 'prior_regional' (default assumido) - rebaixa a confianca.
export function interpretaP(input = {}) {
  const { valor, extrator = 'mehlich1', argila, cultura, origem = 'real' } = input;

  if (!Number.isFinite(Number(valor))) {
    return {
      classe: null,
      _status: 'sem_dado',
      mensagem: 'P nao informado; informe o valor (mg/dm3) da analise para interpretar.',
    };
  }
  const v = Number(valor);
  const ext = String(extrator).toLowerCase().includes('resina') ? 'resina' : 'mehlich1';
  const conf = origem === 'real' ? 'media' : 'baixa';

  if (ext === 'resina') {
    const f = tabela.resina.faixas;
    const classe = classificaPorFaixas(v, f);
    return {
      classe,
      pClasse: paraPClasse(classe),
      valor: v,
      extrator: 'resina',
      critico: f.critico,
      abaixo_critico: v < f.critico,
      origem,
      _source: tabela.resina._source,
      confidence: conf,
    };
  }

  // Mehlich-1: a interpretacao EXIGE o teor de argila (a faixa muda com ela).
  const grupo = grupoCulturaP(cultura);
  const cls = classeArgila(argila);
  if (!cls) {
    return {
      classe: null,
      pClasse: null,
      valor: v,
      extrator: 'mehlich1',
      grupo_cultura: grupo,
      _status: 'argila_ausente',
      mensagem: 'Mehlich-1 exige o teor de argila para interpretar P (a faixa muda com a argila). Informe % argila (ou g/kg).',
      origem,
      _source: tabela.mehlich1[grupo]._source,
    };
  }
  const f = tabela.mehlich1[grupo].por_classe_argila[String(cls)];
  const classe = classificaPorFaixas(v, f);
  return {
    classe,
    pClasse: paraPClasse(classe),
    valor: v,
    extrator: 'mehlich1',
    grupo_cultura: grupo,
    classe_argila: cls,
    critico: f.critico,
    abaixo_critico: v < f.critico,
    origem,
    _source: tabela.mehlich1[grupo]._source,
    confidence: conf,
  };
}

export default interpretaP;
