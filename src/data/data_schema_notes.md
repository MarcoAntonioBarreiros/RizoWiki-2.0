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
