# Pesquisa de referencias - Grafy network intelligence CRM

Data: 2026-05-28

Objetivo: revisar Reddit/Hacker News/Product Hunt, personal CRMs, relationship intelligence e ferramentas de grafo para melhorar o Grafy.

## Tese de produto

O Grafy nao deve competir apenas como "lista de contatos bonita". O espaco ja tem Dex, Clay/Mesh, Monica, Covve, folk, Wave Connect, Cloze e outros.

O diferencial mais promissor para o Grafy:

1. Personal CRM privado.
2. Grafo visual como experiencia central, nao como detalhe.
3. Busca por demanda/problema resolvido.
4. Grupos compartilhados para eventos, comunidades e hubs.
5. Perfil publico opt-in dentro da rede.
6. Importacao/enriquecimento com consentimento.
7. Copiloto que explica por que uma pessoa e relevante.

## Benchmarks principais

### Dex

Aprendizado:

- Foco em follow-up, historico e manter relacoes quentes.
- Integra LinkedIn, email, calendario e extensao.
- Bom para fundador, investidor, creator e networker pesado.

Aplicar no Grafy:

- Criar "proximo follow-up" como objeto forte.
- Mostrar "por que falar com essa pessoa agora".
- Timeline por contato.

### Clay / Mesh

Aprendizado:

- Posicionamento de rolodex bonito, enriquecido e automatico.
- UI premium, poucos elementos por tela, foco em contexto.
- Forte em navegar a rede e surfacing context.

Aplicar no Grafy:

- Melhorar detalhe do contato com contexto rico.
- Mostrar mudancas e sinais recentes como sugestoes, nao como verdades absolutas.
- Reduzir poluicao visual em telas internas.

### Monica

Aprendizado:

- Open-source, privacidade e riqueza de detalhes pessoais.
- Comunidade valoriza controle de dados.
- Mais manual e menos forte para networking profissional/eventos.

Aplicar no Grafy:

- Privacidade como promessa central.
- Exportacao/importacao simples.
- Campo livre e campos customizados realmente uteis.

### Wave Connect / eventos presenciais

Aprendizado:

- QR/NFC, captura rapida, tags, follow-ups e contexto de evento.
- Networking acontece muito no momento, nao depois no escritorio.

Aplicar no Grafy:

- Modo evento: importar lote, tag automatico do evento, follow-up em 24h/7d.
- Meetup e grupos como fonte de contexto.

### Graph.one / relationship intelligence

Aprendizado:

- Busca natural por conexoes profissionais e caminhos fortes.
- Mapeia rede a partir de email/calendario.

Aplicar no Grafy:

- "Quem conhece quem", "ponte ate empresa X", "quem pode me apresentar a Y".
- Relacao deve ter peso/forca, nao ser apenas uma linha.

## Ferramentas de grafo e relacao

### Kumu

Aprendizado:

- Relações complexas ficam compreensiveis quando ha filtros, layouts e mapa bonito.
- Bom para storytelling de sistemas e comunidades.

Aplicar no Grafy:

- Filtros visuais e legenda como parte da experiencia.
- Subgrafos por contexto: pessoal, grupo, publico, evento.

### Neo4j Bloom

Aprendizado:

- Pesquisa/exploracao visual de dados conectados para usuarios nao tecnicos.
- Importante separar modelo de dados, perspectiva e visual.

Aplicar no Grafy:

- Criar "perspectivas": Demanda, Solucao, DDD, Grupo, Fonte, Publico.
- No MVP pode ser Postgres; quando escalar, considerar materializar arestas ou integrar grafo.

### Sigma.js + Graphology

Aprendizado:

- Forte candidato para grafo serio em browser com WebGL.
- Graphology cuida do modelo; Sigma cuida da renderizacao.

Aplicar no Grafy:

- Melhor caminho para evoluir do SVG atual quando o numero de nos aumentar.
- Priorizar para grafo interno/publico.

### Cytoscape.js

Aprendizado:

- Rico em layouts, eventos, seletores e algoritmos.
- Bom quando analise/edicao/consulta estrutural pesa mais que estetica pura.

Aplicar no Grafy:

- Considerar para filtros avancados, selecao de vizinhanca, caminhos e algoritmos.

### React Force Graph

Aprendizado:

- Otimo para prototipos vivos, 2D/3D, particulas em links, drag/zoom/click.

Aplicar no Grafy:

- Bom para landing e prototipo visual.
- Para produto serio, comparar com Sigma antes de adotar como motor final.

## Dores recorrentes capturadas em comunidades e reviews

- Pessoas esquecem contexto de conversas.
- CRMs tradicionais parecem pesados demais para networking pessoal.
- Ferramentas bonitas perdem utilidade se exigem muito input manual.
- Enriquecimento automatico e poderoso, mas levanta preocupacao de privacidade.
- Usuarios querem follow-up, lembretes e "por que agora".
- Eventos presenciais precisam de captura rapida e tagging.
- Grafo e encantador, mas precisa responder perguntas praticas.

## Implicacoes para o PRD

Adicionar ou reforcar:

1. Relationship strength score.
2. Timeline de interacoes por contato.
3. Modo evento/comunidade.
4. Pesos nas arestas do grafo.
5. Explicabilidade dos matches.
6. Exportacao e portabilidade.
7. Privacidade e opt-in como linguagem constante.
8. Subgrafos por contexto.
9. "Perguntas prontas" no chat para usuarios que nao sabem promptar.
10. Quick capture mobile.

## Proximas melhorias de frontend

1. Landing com ritmo editorial: hero, problema, como funciona, grafo, importacoes, privacidade, CTA.
2. App interno menos card-grid e mais workspace: sidebar, canvas, inspector, lista densa.
3. Grafo com motor dedicado e movimentos mais naturais.
4. Cards de contato com avatar/fonte/contexto real, nao so iniciais.
5. Microinteracoes: hover, selected state, transition entre telas, foco de busca.

## Fontes consultadas

- Dex, Clay/Mesh, folk, Monica, Wave Connect, Graph.one, Product Hunt, Hacker News.
- Kumu, Neo4j Bloom, Sigma.js, Graphology, Cytoscape.js, React Force Graph.
- GummySearch/Reddit-indexed e pesquisas web sobre discussoes de personal CRM.

Observacao: busca direta em Reddit retornou poucos resultados indexaveis nesta rodada, entao foram usados agregadores, paginas indexadas, Hacker News e Product Hunt para complementar sinais de comunidade.
