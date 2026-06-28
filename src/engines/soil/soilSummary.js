// soilSummary - orquestra o contexto de solo -> interpretacoes (P, acidez) para o Mapa (Fase R1).
//
// Junta resolveSoilContext (degradacao graciosa) + interpretaP + interpretaAcidez, propagando a
// PROCEDENCIA (real|prior_regional) campo a campo. NAO decide ranking (isso e do
// recommendationEngine); apenas interpreta o solo e expoe pClasse para alimentar o diagnostico.
//
// Principio (usuario): roda com o que houver. Sem analise, interpreta sobre os PRIORS regionais
// (modelo generico, confianca baixa); com a analise, os dados reais sobrescrevem e a confianca sobe
// apenas quando os campos DECISIVOS daquela interpretacao sao reais (revisao GPT).
import { resolveSoilContext, soilConfidence, CAMPOS_DECISIVOS } from './soilContext.js';
import { interpretaP } from './pInterpretationEngine.js';
import { interpretaAcidez } from './acidezEngine.js';

function ehReal(campo) {
  return !!campo && campo.origem === 'real';
}

function preenchido(x) {
  return x !== null && x !== undefined && String(x).trim() !== '';
}

export function buildSoilSummary(form = {}) {
  const soilInput = form.soil || {};
  const soil = resolveSoilContext(soilInput);

  // FOSFORO: usa o valor RESOLVIDO (real ou prior). Decisivos = P e argila; origem 'real' so se
  // ambos forem reais (a classe de P depende da argila, entao argila assumida rebaixa a confianca).
  const pDecisivosReais = ehReal(soil.campos.P) && ehReal(soil.campos.argila);
  const pInterp = interpretaP({
    valor: soil.campos.P.valor,
    extrator: soilInput.extrator,
    argila: soil.campos.argila.valor,
    cultura: form.cultura,
    origem: pDecisivosReais ? 'real' : 'prior_regional',
  });

  // ACIDEZ: pH e V tem prior regional; m (saturacao por Al) ainda nao tem prior, entao so entra se
  // o usuario informar. A leitura e 'real' se qualquer indicador de acidez for real.
  const mInformado = preenchido(soilInput.m);
  const acidezReal = ehReal(soil.campos.pH) || ehReal(soil.campos.V) || mInformado;
  const acidez = interpretaAcidez({
    pH: soil.campos.pH.valor,
    V: soil.campos.V.valor,
    m: mInformado ? soilInput.m : undefined,
    origem: acidezReal ? 'real' : 'prior_regional',
  });

  return {
    soil,
    pInterp,
    pClasse: pInterp.pClasse,
    pConfidence: soilConfidence(soil, CAMPOS_DECISIVOS.fosforo),
    acidez,
  };
}

export default buildSoilSummary;
