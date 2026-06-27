# RizoWiki 2.0

Versao aplicada do RizoWiki: ferramenta de apoio a decisao sobre bioinsumos e rizosfera.

> Apoio a decisao, descritivo e explicavel. Nao e prescricao automatica nem modelo que aprende. Nao substitui bula, legislacao nem avaliacao tecnica responsavel.

## Estado: prototipo funcional em curadoria

Esta base entrega o app React + Vite publicado no GitHub Pages, com Mapa, Fatores e Lab conectados por um mesmo "caso atual". Os motores existem para apoiar a interface, mas os dados tecnicos ainda estao em curadoria.

Ja entregue:

- Estrutura Vite + React, `README.md` e `AGENTS.md`.
- Publicacao preparada para GitHub Pages via `.github/workflows/deploy-pages.yml`.
- Motores `compatibilityEngine`, `diagnosticEngine`, `viabilityEngine` e `protocolEngine`.
- Mapa, Fatores e Lab compartilhando cultura, problema, organismo, umidade, quimico, modo, tempo e UV.
- `organisms.json` consolidado com 9 organismos/grupos como fonte unica de trabalho.
- Dados brutos do RizoWiki 1.0 em `src/data/raw/`, marcados como `pendente_revisao`, `confidence: baixa` e `source: RizoWiki 1.0`.
- Documentos de curadoria em `src/data/`.

Ainda nao e base final:

- `viability.*` em `organisms.json` sao priors demonstrativos, nao calibrados.
- Regras de compatibilidade seguem como rascunho de baixa confianca.
- Dose, manejo e protocolo ainda usam texto do RizoWiki 1.0 como rascunho atribuido.
- Wiki permanece em construcao e nao foi promovido a fonte curada.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # producao
npm test         # suite de motores e dados
```

## Estrutura

```text
src/
  pages/        Wiki, Mapa, Fatores, Lab
  components/   QuickDiagnosisForm, RiskPanel, ViabilityChart, ProtocolReport, ConfidenceBadge
  engines/      compatibility, diagnostic, viability e protocol
  data/         regras operacionais e rascunhos brutos para curadoria
  utils/        avaliacao de risco e exportacao de ficha
  tests/        testes dos motores, dados e exportacao
scripts/        extract_from_1_0.py
```

## Aviso

Ferramenta de apoio a decisao. Ajuste a bula, legislacao, condicoes locais e avaliacao tecnica responsavel.
