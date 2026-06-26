# data_schema_notes.md

## Status

Os arquivos em `src/data/raw/` sao rascunhos didaticos extraidos do RizoWiki 1.0. Todos os registros devem manter:

- `status: pendente_revisao`
- `draft_type: rascunho_didatico`
- `confidence: baixa`
- `source: RizoWiki 1.0`

## Regra de ouro

Nao transformar nenhum valor do RizoWiki 1.0 em parametro final sem revisao humana e fonte citavel.

## Esquema alvo de `organisms.json`

Campos previstos: `label`, `form`, `functions`, `ideal_temp_c`, `operational_resilience`, `uv_sensitivity`, `decay_k_base_per_h`, `chemical_sensitivity_by_class`, `compat_notes`, `sources`.

## Observacoes

- `micorrizas` e `mycorrhiza` devem ser normalizados para `micorrizas`.
- `compatibilidadePratica` do 1.0 e texto cru; precisa virar regra estruturada com condition/effect/message somente apos curadoria.
- Valores `lab`, `stressResistance`, `compatibility` e `persistence` sao heuristicas didaticas do 1.0, nao medidas.

## Estrutura real de `organisms.json` (implementada na consolidacao)

A fonte unica esta em `src/data/organisms.json` (substitui os drafts paralelos). Por organismo:

- `label`, `form[]`, `functions[]` (vocabulario compartilhado com o diagnosticEngine), `sources[]`.
- `viability`: `{ ideal_temp_c, decay_k_base_per_h, uv_sensitivity, effective_threshold_log, chemical_sensitivity_by_class, _basis }`
  -> consumido pelo viabilityEngine (Lab) e pelo riskAssessment (Fatores). PRIORS demonstrativos, nao calibrados.
- `protocol`: `{ culturas, metodo, dose_range, critical, ordem_mistura, manejo, monitorar[] }` (verbatim do 1.0)
  -> consumido pelo protocolEngine (ficha do Mapa).
- `_status` / `_confidence`: `pendente_revisao` / `baixa`.

Consumidores: `Lab.jsx`, `riskAssessment.js`, `RiskPanel.jsx` leem `.viability`; `protocolEngine.js` le `.protocol`.
As regras de compatibilidade ficam separadas em `compatibility_rules.json` (cobre os 9 organismos).
A extracao bruta fiel permanece em `raw/organisms_raw_from_1_0.json` (auditoria).
