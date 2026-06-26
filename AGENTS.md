# AGENTS.md - RizoWiki 2.0

Ferramenta didatica e aplicada sobre bioinsumos e rizosfera.

Principio: apoio a decisao, descritivo e explicavel; nunca prescricao automatica nem modelo que aprende.

## Regras

1. E apoio a decisao, nao prescricao automatica.
2. Toda saida aplicada traz nivel de confianca e lista de limitacoes.
3. Nao inventar dados de dominio nem constantes cientificas. Usar os do brief e os extraidos do 1.0; o que faltar, marcar null e reportar.
4. Constantes de modelo sao priors de especialista, nunca apresentadas como medidas. Nao alterar sem pedido explicito.
5. Separar dados, regras e UI. Nenhuma regra de decisao dentro de componente visual.
6. Um motor por preocupacao, reusado por todas as abas. Nao duplicar logica.
7. viabilityEngine usa decaimento de primeira ordem, nunca media plana.
8. Quimico e organismo x classe, nao escalar unico.
9. Testes para todo motor de decisao.
10. Nao implementar aprendizado automatico nesta fase. Feedback = planilha externa.

## Estado atual

- compatibilityEngine esta implementado e testado.
- viabilityEngine, diagnosticEngine e protocolEngine ainda nao foram implementados.
- A fonte unica curada src/data/organisms.json ainda nao existe.
- Dados brutos ficam em src/data/raw/ e continuam pendente_revisao, confidence baixa e source RizoWiki 1.0.

## Publicacao

Publicacao via GitHub/GitHub Pages neste projeto.
