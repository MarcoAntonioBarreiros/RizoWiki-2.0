# src/data

Camada de dados do RizoWiki 2.0.

## Estado atual

- `compatibility_rules.json`: regras estruturadas para a Fase 1, ainda `pendente_revisao`, `confidence: baixa` e `source: RizoWiki 1.0`.
- `organisms.json`: fonte unica de trabalho com 9 organismos/grupos, ainda `pendente_revisao` e `confidence: baixa`.
- `evidence/evidence_registry.json`: fontes e claims registrados para iniciar calibracao sem promover parametros automaticamente.
- `raw/organisms_raw_from_1_0.json`: rascunho didatico bruto do 1.0, nao fonte de verdade.
- `raw/compatibility_rules_raw_from_1_0.json`: textos crus de compatibilidade do 1.0.
- `crop_rules.json`: ainda nao existe; depende de fonte tecnica/regional.

## Regra de curadoria

Nenhum valor do RizoWiki 1.0 deve virar parametro final sem fonte oficial, tecnica ou artigo revisado.

Em especial, `organisms.json` mistura:

- texto descritivo/protocolo do RizoWiki 1.0, atribuido e marcado como rascunho;
- `viability.*` demonstrativo, usado para fazer o Lab funcionar e comparar cenarios;
- `sources[]` vindas dos estudos de caso didaticos do 1.0, que nao validam automaticamente os priors numericos.
