// kInterpretationEngine - interpreta o K REAL do usuario pela tabela citada do CQFS-RS/SC 2016
// (Tabela 6, Grupo II; conferida em Tiecher et al.). Analogo ao motor de P, mas a faixa muda com a
// CTC (a pH 7,0), nao com a argila. Fundacao do modulo de NPK (recomendacao vem depois).
//
// INTEGRIDADE: todos os limiares vem de k_interpretation.json (2016). Sem o dado (valor ou CTC) ->
// nao classifica e diz o que falta.
import tabela from '../../data/soil/k_interpretation.json';

function parseOpt(x) {
  if (x === null || x === undefined) return null;
  const s = String(x).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Classe de CTC (pH 7,0): A (<=7,5), B (7,6-15), C (15,1-30), D (>30).
export function classeCTC(ctc) {
  const c = parseOpt(ctc);
  if (c === null) return null;
  for (const f of tabela.classes_ctc.faixas) {
    if (f.ctc_max === null || c <= f.ctc_max) return f.classe;
  }
  return 'D';
}

function classifica(v, f) {
  if (v <= f.muito_baixo_max) return 'muito_baixo';
  if (v <= f.baixo_max) return 'baixo';
  if (v <= f.medio_max) return 'medio';
  if (v <= f.alto_max) return 'alto';
  return 'muito_alto';
}

// Ponte para o vocabulario de 3 classes (baixo/medio/alto), util na recomendacao.
export function paraKClasse(classeCQFS) {
  if (classeCQFS === 'muito_baixo' || classeCQFS === 'baixo') return 'baixo';
  if (classeCQFS === 'medio') return 'medio';
  if (classeCQFS === 'alto' || classeCQFS === 'muito_alto') return 'alto';
  return null;
}

// interpretaK({ valor, ctc, origem }) -> classe + critico + procedencia. valor e ctc do laudo.
export function interpretaK(input = {}) {
  const { valor, ctc, origem = 'real' } = input;
  const v = parseOpt(valor);
  if (v === null) {
    return {
      classe: null,
      _status: 'sem_dado',
      mensagem: 'K nao informado; informe o valor (mg/dm3) da analise para interpretar.',
    };
  }
  const cls = classeCTC(ctc);
  if (!cls) {
    return {
      classe: null,
      pClasse: null,
      valor: v,
      _status: 'ctc_ausente',
      mensagem: 'A interpretacao de K exige a CTC (a faixa muda com a CTC pH7,0). Informe a CTC.',
      origem,
      _source: tabela._meta._source,
    };
  }
  const f = tabela.por_classe_ctc[cls];
  const classe = classifica(v, f);
  return {
    classe,
    kClasse: paraKClasse(classe),
    valor: v,
    classe_ctc: cls,
    critico: f.critico,
    abaixo_critico: v < f.critico,
    origem,
    _source: tabela._meta._source,
    confidence: origem === 'real' ? 'media' : 'baixa',
  };
}

export default interpretaK;
