# evidence

Camada de evidencias para substituir gradualmente os rascunhos didaticos por base
tecnica auditavel.

## Regra

Registrar fonte nao promove parametro automaticamente.

Cada entrada deve dizer:

- qual fonte foi usada;
- qual claim a fonte sustenta;
- a quais organismos/culturas/modos se aplica;
- quais campos do app ela pode ajudar a revisar;
- qual acao de calibracao ainda falta.

## Status possiveis

- `fonte_candidata`: fonte encontrada, ainda sem extracao suficiente.
- `evidencia_registrada`: claim extraido em linguagem operacional, ainda nao promove valor.
- `calibrado_parcial`: campo do app foi revisado por fonte, mas ainda pode ter lacunas.
- `calibrado`: campo revisado com fonte adequada e revisao humana.

## Proibido

- Transformar texto do RizoWiki 1.0 em parametro final.
- Transformar uma fonte geral em constante numerica sem metodologia compativel.
- Usar `sources[]` de `organisms.json` como validacao automatica dos priors de viabilidade.
