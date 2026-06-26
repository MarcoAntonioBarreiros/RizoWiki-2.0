# curation_todo.md

Pendencias antes de promover dados a fonte unica curada.

## Chaves e ambiguidades

- Confirmar `micorrizas` como id canonico para `mycorrhiza`.
- Separar grupos heterogeneos: `bioinseticidas`, `bacillus`, `rhizobium` e `fixadores` agregam organismos diferentes.
- Resolver conflitos entre `bioData.js` e `bioDataLab.js`, especialmente `trichoderma`, `micorrizas`, `bacillus` e nomes de grupos.

## Campos ausentes

- `form` estruturado.
- `functions` com taxonomia estavel.
- `ideal_temp_c` validado.
- `operational_resilience` revisado.
- `uv_sensitivity`.
- `decay_k_base_per_h`.
- `chemical_sensitivity_by_class`.
- `effective_threshold_log`.
- doses por cultura e modo de aplicacao.

## Fontes necessarias

- Bulas e fichas tecnicas oficiais.
- Registros e legislacao aplicavel a bioinsumos.
- Manuais regionais de fertilidade e manejo do solo.
- Artigos revisados por pares para cinetica, compatibilidade, dose, temperatura, UV e eficacia.

## Fase 1

- `compatibility_rules.json` e operacional para testes e revisao.
- As classificacoes `semaphore` e `effect` ainda nao sao parametro final validado.
