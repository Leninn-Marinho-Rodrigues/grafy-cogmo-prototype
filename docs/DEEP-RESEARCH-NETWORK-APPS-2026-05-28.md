# Pesquisa profunda - apps de network, personal CRM e grafos

Data: 2026-05-28

Objetivo: refazer a busca em comunidades, produtos similares, bibliotecas e referencias de frontend para fortalecer o Grafy como um produto real de networking inteligente, e nao apenas como uma tela bonita de contatos.

## Conclusao executiva

O Grafy deve ser posicionado como um **personal CRM visual com inteligencia de relacoes**, com uma diferenca clara: transformar contatos, grupos, demandas, problemas resolvidos, eventos e perfis publicos em um mapa acionavel.

O aprendizado mais forte desta rodada e:

1. Personal CRM bom resolve memoria relacional, follow-up e contexto.
2. Networking de verdade precisa capturar o momento: evento, conversa, origem, demanda e proximo passo.
3. Grafo so encanta se responder perguntas praticas: quem ajuda, quem conecta, quem precisa de algo, quem esta perto de uma oportunidade.
4. Enriquecimento automatico e desejado, mas deve ser consentido e explicavel.
5. LinkedIn nao deve ser tratado como fonte para scraping. O caminho correto e API oficial quando aprovada, importacao manual autorizada ou enriquecimento assistido com confirmacao do usuario.
6. Para escalar visualmente, o SVG atual deve evoluir para um motor dedicado de grafo, com Sigma.js + Graphology como candidato principal.
7. A landing precisa parecer um produto vivo: fundo interativo, secoes separadas, transicoes suaves, CTA claro, narrativa de valor e demonstracao visual do grafo.

## Observacao sobre Reddit e comunidades

Foram feitas buscas por Reddit e comunidades usando pesquisa web, termos como personal CRM, relationship management, Dex, Clay, Monica, network contacts, contatos e networking. A busca direta via endpoints do Reddit/old Reddit retornou bloqueio 403 nesta maquina, entao os sinais foram complementados com resultados indexados, Hacker News, Product Hunt, paginas oficiais, documentacao tecnica e benchmarks de produtos.

Para uma rodada ainda mais profunda de comentarios brutos do Reddit, os melhores caminhos seriam:

- usar a busca manual logada no navegador;
- usar a Reddit API com credenciais oficiais;
- usar agregadores de pesquisa em Reddit, como GummySearch, quando disponivel;
- capturar links especificos de threads e arquivar trechos curtos com data.

Mesmo com essa limitacao, o padrao de dor encontrado e consistente com comunidades e reviews de personal CRM: pessoas querem lembrar contexto, manter relacoes quentes, nao preencher um CRM pesado, encontrar quem pode ajudar e evitar ferramentas invasivas.

## Mapa de produtos similares

### 1. Personal CRM e relationship memory

#### Dex

O que aprender:

- follow-up e lembretes sao centrais;
- valor esta em manter relacoes ativas, nao apenas armazenar contatos;
- integracoes com email, calendario, LinkedIn e extensoes reduzem trabalho manual.

Aplicar no Grafy:

- criar objeto "proximo contato" no modelo;
- cada contato deve mostrar "por que falar agora";
- dashboard deve ter fila de follow-ups e relacoes esfriando;
- o chat deve responder "quem eu deveria contatar esta semana?".

Evitar:

- virar so um CRM de lembretes sem a camada visual de grafo.

#### Clay / Mesh

O que aprender:

- experiencia premium, limpa e altamente contextual;
- enriquecimento e organizacao automatica sao percebidos como magicos;
- a interface valoriza poucos elementos fortes por tela.

Aplicar no Grafy:

- detalhe de contato com contexto rico: origem, ultima interacao, demandas, tags, grupos e conexoes relevantes;
- reduzir excesso de cards em telas internas;
- usar uma linguagem visual de "mapa da rede" e nao "planilha bonita".

Evitar:

- prometer enriquecimento automatico sem fontes autorizadas.

#### Monica

O que aprender:

- privacidade e controle de dados sao diferenciais reais;
- open source/pessoal passa confianca para usuarios que nao querem entregar toda a vida relacional a um SaaS fechado;
- campos pessoais e historico enriquecem relacoes de longo prazo.

Aplicar no Grafy:

- deixar exportacao, privacidade e opt-in visiveis;
- separar claramente contato privado, grupo compartilhado e perfil publico;
- permitir campos customizados simples e uteis.

Evitar:

- deixar a experiencia profissional/eventos fraca demais.

#### Covve, Cloze, folk e similares

O que aprender:

- usuarios valorizam scanner, enriquecimento, lembretes, sync e segmentacao;
- bons CRMs de contato oferecem listas densas, filtros rapidos e acoes de lote;
- ferramentas profissionais precisam de importacao/exportacao robusta.

Aplicar no Grafy:

- importar CSV com preview, mapeamento de campos e deduplicacao;
- ter filtros avancados sempre acessiveis;
- suportar segmentos salvos: "investidores", "clientes", "parceiros", "evento X".

## 2. Relationship intelligence e CRM de rede

### Affinity, Attio, LeadDelta e Breakcold

O que aprender:

- o valor B2B esta em relacao, sinal e pipeline;
- relacionamento com empresa/organizacao deve ser entidade forte;
- social selling funciona quando integra contexto social, email, tags e historico.

Aplicar no Grafy:

- adicionar entidade Organizacao/Empresa no modelo;
- permitir caminhos: Pessoa -> Empresa -> Grupo -> Demanda;
- criar score simples de forca da relacao;
- explicar recomendacoes: "relevante porque resolve X, esta no grupo Y e tem tag Z".

Evitar:

- transformar o Grafy em CRM comercial tradicional antes de validar o diferencial de grafo/networking.

## 3. Eventos, comunidades e networking presencial

### Grip, Bizzabo, Brella, Wave Connect e Meetup

O que aprender:

- eventos precisam de captura rapida e contexto imediato;
- matchmaking de participantes e agenda de reunioes sao funcionalidades fortes;
- QR/NFC/cartao digital funciona bem para salvar contatos no momento certo;
- comunidade/grupo compartilhado e uma extensao natural de networking.

Aplicar no Grafy:

- criar "Modo Evento":
  - tag automatica do evento;
  - captura rapida por formulario mobile;
  - importacao CSV do evento;
  - follow-up automatico em 24h/7d;
  - grafo do evento com clusters por tags/demandas.
- usar Meetup como conector futuro de contexto:
  - grupos;
  - eventos;
  - topicos;
  - possiveis participantes/membros quando permitido pela API.

Evitar:

- depender de dados de terceiros sem OAuth, permissao e termos claros.

## 4. Plataformas de grafo e visualizacao relacional

### Kumu

O que aprender:

- mapas de relacao ficam fortes quando ha narrativa, filtros e legenda;
- visualizacao deve ter perspectivas, nao apenas zoom/pan.

Aplicar no Grafy:

- criar perspectivas do grafo:
  - Pessoas;
  - Demandas;
  - Problemas que resolve;
  - DDD/regiao;
  - Grupos;
  - Fontes de importacao;
  - Perfis publicos.

### Graph Commons

O que aprender:

- grafos publicos/comunitarios funcionam melhor com curadoria e contexto;
- cada no/aresta precisa ter significado claro para ser exploravel.

Aplicar no Grafy:

- o perfil publico deve ser opt-in e explicito;
- grupos compartilhados devem ter curadoria/admin;
- a legenda deve explicar o que cada linha e cor significa.

### Neo4j Bloom

O que aprender:

- usuarios nao tecnicos exploram grafos melhor com busca natural e perspectivas visuais;
- a camada de consulta e tao importante quanto a renderizacao.

Aplicar no Grafy:

- manter Postgres no MVP, mas modelar arestas de modo que seja possivel migrar ou espelhar para Neo4j depois;
- criar `graph_edges` materializado quando performance exigir;
- chat deve virar entrada natural para explorar o grafo.

### InfraNodus

O que aprender:

- clusters e lacunas sao mais valiosos que uma nuvem de pontos bonita;
- "bridges" e termos conectores geram insights.

Aplicar no Grafy:

- detectar pontes:
  - pessoas com muitas conexoes entre grupos;
  - pessoas que conectam demanda e solucao;
  - tags com clusters pouco explorados.

## Bibliotecas recomendadas

### Grafo de produto

#### Sigma.js + Graphology

Recomendacao: melhor candidato para o grafo principal do produto.

Por que:

- renderizacao WebGL;
- bom para bases maiores;
- Graphology separa o modelo de dados da visualizacao;
- permite layouts, filtros, comunidades e algoritmos com mais disciplina.

Uso no Grafy:

- substituir o SVG atual no grafo interno/publico;
- suportar centenas/milhares de nos;
- manter zoom, pan, hover, clique e selecao;
- criar filtros por tag, DDD, origem, tipo, demanda e problema resolvido.

### Cytoscape.js

Recomendacao: candidato forte se o produto precisar de mais algoritmos e seletores.

Por que:

- layouts ricos;
- seletores poderosos;
- boa base para vizinhanca, caminhos e analise estrutural.

Uso no Grafy:

- testar para "mostrar caminho entre duas pessoas";
- analisar clusters e vizinhancas;
- eventualmente usar no painel de inteligencia.

### React Force Graph

Recomendacao: excelente para prototipos vivos, landing e demonstracoes.

Por que:

- visual muito dinamico;
- 2D/3D;
- links com particulas;
- drag/zoom intuitivo.

Uso no Grafy:

- landing page;
- mini-grafo animado do dashboard;
- prototipo de grafo publico.

Risco:

- para produto grande, comparar performance e controle visual com Sigma.

### D3

Recomendacao: usar seletivamente, nao como motor inteiro do produto.

Por que:

- excelente para forcas/layouts e visualizacoes customizadas;
- exige mais codigo e manutencao.

Uso no Grafy:

- layouts especificos;
- pequenas visualizacoes de tendencias;
- calculo ou simulacao customizada.

## Bibliotecas e efeitos de frontend

### tsParticles

Uso recomendado:

- fundo de rede/particulas;
- interacao com mouse;
- links entre pontos;
- estados leves na landing.

Bom para:

- substituir animacoes duras do fundo;
- dar vida ao hero sem criar peso excessivo.

### Vanta.js NET

Uso recomendado:

- avaliar para landing se quisermos um efeito rapido de rede viva.

Risco:

- pode parecer generico se nao for customizado com a identidade do Grafy.

### Aceternity UI / Magic UI

Uso recomendado:

- usar como referencia de padroes de beams, borders, hover, background e transicoes;
- adaptar visualmente, sem copiar o site inteiro.

Risco:

- muitos componentes prontos deixam a landing com cara de template se usados sem criterio.

### Uiverse

Uso recomendado:

- inspiracao de botoes, toggles, estados hover e microinteracoes CSS.

Risco:

- alguns componentes sao chamativos demais; usar apenas se o resultado parecer premium e legivel.

### CSS spotlight effect

Uso recomendado:

- manter e melhorar efeito de spotlight com cursor;
- aplicar em secoes especificas, nao em tudo.

## Integracoes tecnicas

### Google Contacts

Caminho correto:

- OAuth com Google;
- escopo de contatos via Google People API;
- backend seguro ou Supabase Edge Function;
- import job com preview;
- usuario aprova importacao;
- deduplicacao por email/telefone.

MVP ideal:

1. botao "Conectar Google";
2. consentimento;
3. buscar contatos;
4. normalizar telefones/emails;
5. mostrar preview;
6. sugerir duplicados;
7. importar aprovado.

### LinkedIn

Caminho correto:

- usar apenas APIs oficiais aprovadas;
- permitir o usuario colar/exportar dados autorizados;
- enriquecimento assistido sempre com confirmacao;
- nunca scraping automatizado de perfis logados.

MVP recomendado:

- campo LinkedIn URL no contato;
- botao "marcar para revisar";
- importacao CSV/export manual quando o usuario tiver fonte legal;
- placeholder de integracao oficial.

### Meetup

Caminho correto:

- OAuth/API oficial;
- foco em grupos, eventos, topicos e contexto;
- nao prometer dados de participantes que a API nao liberar.

Uso no Grafy:

- grupo do Meetup vira Grupo Compartilhado;
- evento vira Fonte de Importacao e Tag;
- topicos viram Tags sugeridas;
- follow-up pos-evento.

### Supabase

Caminho correto:

- Auth com Google e magic link;
- Postgres com RLS;
- storage para avatares;
- Edge Functions para importacoes;
- tabelas separadas para escopos privado, grupo e publico.

Prioridade:

1. `user_profiles`;
2. `contacts`;
3. `contact_emails`;
4. `contact_phones`;
5. `tags`;
6. `contact_tags`;
7. `groups`;
8. `group_members`;
9. `public_profiles`;
10. `graph_edges`;
11. `import_jobs`;
12. `merge_suggestions`.

## UX que o Grafy deve perseguir

### Landing page

Deve parecer um produto vivo e premium:

- hero com grafo/particulas interativo em tela cheia;
- paineis do produto bem distribuidos, nao amontoados;
- uma narrativa por secoes:
  1. promessa clara;
  2. como funciona;
  3. importacoes;
  4. grafo inteligente;
  5. grupos/eventos;
  6. privacidade;
  7. CTA para entrar no prototipo.
- transicoes suaves entre secoes;
- resposta ao mouse;
- botao principal forte;
- nada de texto gigante explicando o obvio dentro do app.

### App interno

Deve parecer workspace, nao landing:

- sidebar no desktop;
- bottom nav no mobile;
- lista densa e filtravel;
- grafo com inspector lateral;
- detalhes de contato com timeline;
- chat/copiloto com resultados acionaveis;
- tela de importacao com progresso e preview realista.

### Grafo

O grafo precisa ter papel de produto:

- filtros sempre claros;
- legenda visual;
- zoom/pan;
- drag de nos;
- hover com preview;
- clique abre inspector;
- highlights de caminhos;
- cores por tipo de no;
- espessura por forca da relacao;
- animacao de links para dar sensacao viva;
- perspectiva ativa muito clara: privado, grupo, publico, evento.

## Features novas sugeridas para o PRD

### Relationship Strength

Score simples para cada contato/relacao:

- origem;
- quantidade de interacoes;
- ultima interacao;
- tags compartilhadas;
- grupos em comum;
- demanda/solucao complementar;
- preenchimento de dados.

### Follow-up Queue

Fila de contatos sugeridos:

- "falar hoje";
- "reconectar esta semana";
- "pode ajudar em X";
- "importado recentemente sem revisao";
- "demanda atual sem match".

### Modo Evento

Fluxo especial para eventos:

- criar evento/grupo;
- importar CSV ou capturar manualmente;
- aplicar tag automatica;
- registrar onde conheceu;
- gerar follow-up;
- criar grafo do evento.

### Match explicavel

Todo match deve responder:

- por que essa pessoa apareceu?
- que dado sustentou a recomendacao?
- qual proxima acao?

Exemplo:

> "Marina apareceu porque resolve automacao financeira, esta no grupo Founders SP e tem demanda parecida com o desafio atual de Rafael."

### Subgrafos salvos

O usuario deve salvar visoes:

- "Meus investidores";
- "Pessoas de IA";
- "Evento Web Summit";
- "Quem resolve vendas";
- "Demandas em aberto".

### Privacidade como produto

Mostrar com clareza:

- o que e privado;
- o que e publico;
- o que pertence a grupo;
- quando um perfil publico corresponde a um contato privado;
- exportacao dos dados;
- opt-in para perfil visivel.

## Backlog tecnico recomendado

### Curto prazo - prototipo showable

1. Melhorar landing com secoes mais espacadas e interativas.
2. Trocar mini-grafo/landing para `react-force-graph` ou `tsParticles` bem customizado.
3. Reorganizar app interno em workspace mais denso.
4. Melhorar contatos demo para parecerem perfis reais, com fontes, organizacoes, demandas e historico.
5. Criar "Modo Evento" demo.
6. Melhorar chat com perguntas prontas e cards de resultado.
7. Criar inspector lateral do grafo.

### Medio prazo - MVP funcional real

1. Supabase Auth.
2. Schema Postgres + RLS.
3. CRUD real de contatos/tags/campos customizados.
4. Importacao CSV com preview.
5. Deduplicacao persistida.
6. Public profile opt-in real.
7. Grupos compartilhados com membros.
8. Google Contacts via People API.

### Longo prazo - produto diferenciavel

1. Sigma.js + Graphology para grafo principal.
2. Relationship Strength.
3. Matching complementar demanda/problema.
4. Copiloto com ferramentas e confirmacao de escrita.
5. Integracoes oficiais: Google, LinkedIn quando aprovado, Meetup, calendario/email.
6. API publica/OpenAPI.
7. Analise de comunidades e recomendacao de warm intros.

## Checklist de qualidade para proximas implementacoes

Toda nova tela do Grafy deve passar por:

- tem uma acao principal clara?
- funciona bem em Android?
- tem estado vazio?
- tem loading?
- tem erro?
- tem dado realista?
- nao mistura escopos privado/grupo/publico?
- evita prometer integracao que ainda nao existe?
- grafo ou animacao tem funcao, nao so enfeite?
- mouse/touch responde suavemente?
- texto cabe nos componentes em mobile?
- nao parece template generico?

## Fontes e links consultados

Produtos:

- https://getdex.com/
- https://clay.earth/
- https://www.monicahq.com/
- https://covve.com/
- https://www.folk.app/
- https://www.cloze.com/
- https://www.affinity.co/
- https://www.attio.com/
- https://www.leaddelta.com/
- https://www.breakcold.com/

Eventos e comunidades:

- https://www.grip.events/
- https://www.bizzabo.com/
- https://www.brella.io/
- https://wavecnct.com/
- https://www.meetup.com/graphql/

Grafos:

- https://kumu.io/
- https://graphcommons.com/
- https://neo4j.com/product/bloom/
- https://infranodus.com/

Bibliotecas:

- https://www.sigmajs.org/
- https://graphology.github.io/
- https://js.cytoscape.org/
- https://github.com/vasturiano/react-force-graph
- https://d3js.org/
- https://particles.js.org/
- https://www.vantajs.com/

Frontend/UI:

- https://frontendmasters.com/blog/css-spotlight-effect/
- https://uiverse.io/
- https://ui.aceternity.com/
- https://magicui.design/

APIs:

- https://developers.google.com/people/api/rest/v1/people.connections/list
- https://developer.linkedin.com/product-catalog
- https://www.meetup.com/graphql/
- https://supabase.com/docs/guides/auth/social-login/auth-google

