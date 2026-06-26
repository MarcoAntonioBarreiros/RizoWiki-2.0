# RizoWiki 2.0

Versao aplicada do RizoWiki: ferramenta de apoio a decisao sobre bioinsumos e rizosfera.

> Apoio a decisao, descritivo e explicavel. Nao e prescricao automatica nem modelo que aprende. Nao substitui bula, legislacao nem avaliacao tecnica responsavel.

## Estado: Fases 0-1

Esta base entrega o andaime React + Vite, dados crus para curadoria e o `compatibilityEngine` com testes. As telas seguem como placeholders e os demais motores ainda nao foram implementados.

Ja entregue:

- Estrutura Vite + React, `README.md` e `AGENTS.md`.
- Publicacao preparada para GitHub Pages via `.github/workflows/deploy-pages.yml`.
- `compatibilityEngine` implementado lendo `src/data/compatibility_rules.json`.
- Dados brutos do RizoWiki 1.0 em `src/data/raw/`, marcados como `pendente_revisao`, `confidence: baixa` e `source: RizoWiki 1.0`.
- Documentos de curadoria em `src/data/`.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # producao
npm test         # testes do compatibilityEngine
```

## Estrutura

```text
src/
  pages/        Wiki, Mapa, Fatores, Lab
  components/   QuickDiagnosisForm, RiskPanel, ViabilityChart, ProtocolReport, ConfidenceBadge
  engines/      compatibilityEngine implementado; demais motores nas proximas fases
  data/         regras operacionais e rascunhos brutos para curadoria
  utils/        exportacao futura de relatorios
  tests/        testes do compatibilityEngine
scripts/        extract_from_1_0.py
```

## Aviso

Ferramenta de apoio a decisao. Ajuste a bula, legislacao, condicoes locais e avaliacao tecnica responsavel.
