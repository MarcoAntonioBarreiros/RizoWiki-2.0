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

## Atualizacao - inicio da calibracao por evidencias

Criada a camada `src/data/evidence/evidence_registry.json` para registrar fontes e claims
antes de alterar parametros do app.

Primeira rodada registrada:
- `bacillus`: fontes Embrapa/Infoteca e Embrapa sobre BiomaPhos e bacterias solubilizadoras
  de fosfato.
- `rhizobium`: fontes Embrapa/Infoteca sobre inoculacao de soja com Bradyrhizobium e
  compatibilidade com fungicida em tratamento de sementes.
- `trichoderma`: fontes Embrapa/Infoteca sobre manejo de Trichoderma e antagonismo in vitro.

Segunda rodada registrada (Claude, fontes verificadas):
- `fixadores`/Azospirillum: Embrapa Documentos 325 (Hungria, 2011 - verificada por fetch) +
  Circular Tecnica 166 (coinoculacao Bradyrhizobium + Azospirillum).
- `pseudomonas`: Embrapa Documentos 155 (rizobacterias: sideroforos, antibiose, biocontrole).
- `methylobacterium`: artigo revisado Springer (milho/morango, DOI 10.1007/s12223-023-01078-4)
  + CONTRAPONTO revisado (PMC11510831: efeito LIMITADO de M. symbioticum foliar em campo).
  Mesma regra: nenhuma constante de viabilidade promovida; tudo fonte_candidata/evidencia_registrada.

Terceira rodada registrada (Claude, fontes verificadas) - completa os 9 organismos:
- `bioinseticidas`: Embrapa - Pequeno Manual sobre Fungos Entomopatogenicos (Doc 286) +
  Tecnica de producao de Metarhizium anisopliae (handle/968726).
- `micorrizas`: Embrapa - Manual de Curadores de Germoplasma de FMA (Doc 334, PDF lido/verificado).
- `pnsb`: revisoes revisadas (MDPI) sobre bacterias fotossinteticas/PNSB e R. palustris em arroz.
  Evidencias agora cobrem OS 9 ORGANISMOS. Proximo passo real: extrair de cada fonte dose/modo/
  ressalvas e so entao propor `calibrado_parcial` por campo (nunca promover viability.* sem cinetica).

Importante:
- Nenhum `viability.*` foi promovido a calibrado.
- Nenhum semaforo de `compatibility_rules.json` foi alterado nesta rodada.
- Proximo passo: extrair dose, modo, ingredientes/condicoes e ressalvas de cada fonte
  para entao propor `calibrado_parcial`.

## Fase 1

- `compatibility_rules.json` e operacional para testes e revisao.
- As classificacoes `semaphore` e `effect` ainda nao sao parametro final validado.

## Atualizacao - consolidacao (organisms.json)

Criada a fonte unica `src/data/organisms.json` (9 organismos), que o app passou a ler;
removidos `viability_priors_draft.json` e `protocol_drafts_from_1_0.json`. A extracao
bruta `raw/organisms_raw_from_1_0.json` permanece como auditoria.

PENDENTE (alta prioridade) - priors de viabilidade SEM fonte:
- Os 9 organismos tem `viability.*` (ideal_temp_c, decay_k_base_per_h, uv_sensitivity,
  effective_threshold_log, chemical_sensitivity_by_class) como RASCUNHO demonstrativo.
- 4 vieram do rascunho do GPT (bacillus, trichoderma, rhizobium, pseudomonas); 5 foram
  DERIVADOS aqui da narrativa qualitativa do 1.0 (fixadores, methylobacterium,
  bioinseticidas, micorrizas, pnsb) - ver `viability._basis` de cada organismo.
- Nenhum tem fonte tecnica/bula/artigo. Calibrar TODOS antes de tratar como tecnico.

Ressalvas especificas:
- `micorrizas`: dose em propagulos (nao log UFC) -> viabilidade log-linear semanticamente
  limitada; rever modelo/unidade.
- `bioinseticidas`: prior unico para categoria heterogenea (fungos+bacterias+metabolitos)
  - separar por organismo/produto.
- `trichoderma`: `ideal_temp_c=26` resolve em silencio o conflito 26(bioData) vs
  25(bioDataLab) - confirmar.

Outras:
- `functions` agora usa vocabulario compartilhado com o diagnosticEngine; revisar taxonomia.
- `compatibility_rules.json` cobre os 9 organismos (rascunho); validar condicoes, classes e doses.
