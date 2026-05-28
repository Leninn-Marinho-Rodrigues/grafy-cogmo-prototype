# Analise do Grafy - site publicado, referencias e oportunidades

Data da analise: 2026-05-28
Site analisado: https://grafyy.lovable.app/
Workspace local: C:\Users\lenin\OneDrive\Documentos\Grafy - Cogmo

## 1. Diagnostico do site atual

O site publicado ja comunica bem a direcao visual do produto: dark mode, linguagem de inteligencia de networking, grafo com sensacao de constelacao, CTA claro e promessa de PWA. A primeira impressao esta alinhada ao PRD.

O que existe visivelmente hoje:

- Landing page em portugues com a proposta "Sua rede, mapeada e conectada".
- Secao de grafo/constelacao com legenda para pessoas, tags, fontes e DDDs.
- Cards de promessa de produto: gestao inteligente, grafo, IA copiloto, rede compartilhada, privacidade e PWA.
- Tela de login em `/auth` com Google login e magic link.
- Manifest PWA em `/manifest.json`.
- Rotas internas declaradas no bundle, como `/app`, `/app/contatos`, `/app/grafo`, `/app/grupos`, `/app/rede`, `/app/chat`, `/app/perfil` e `/app/config`.

Lacunas tecnicas encontradas:

- `/app` e rotas internas redirecionam para `/auth`, portanto nao ha app navegavel publico sem autenticacao.
- `/dashboard` retorna 404.
- Nao foi encontrado service worker registrado no browser; URLs comuns como `/sw.js` e `/service-worker.js` retornaram 404.
- O manifest usa icone placeholder SVG e ainda nao tem conjunto completo de icones PWA em PNG/maskable.
- O HTML tem warning de metatag mobile: falta `mobile-web-app-capable`.
- A landing fala em PWA offline/sincronizacao, mas isso ainda nao esta comprovado na implementacao.
- O app ainda parece mais uma prova visual/landing com auth do que um MVP funcional completo.
- O badge do Lovable aparece no site publicado; deve ser removido em ambiente de producao.

Conclusao: o projeto tem uma boa camada de apresentacao inicial, mas ainda precisa virar produto real: dados, schema, RLS, importacao, contatos, grafo operacional, grupos, perfil publico, chat e PWA offline.

## 2. Posicionamento recomendado

Nome recomendado: Grafy

Descricao curta:

Grafy e um CRM de networking inteligente que transforma contatos, grupos e perfis publicos em um mapa vivo de relacoes, demandas, solucoes e oportunidades.

Tese do produto:

O diferencial nao deve ser apenas "guardar contatos". O diferencial deve ser responder rapidamente:

- Quem na minha rede resolve este problema?
- Quem esta buscando algo que outra pessoa oferece?
- Quem pode me apresentar a pessoa certa?
- Quais grupos, tags, DDDs, fontes e contextos revelam oportunidades escondidas?
- Quais contatos merecem follow-up agora?

Principio central:

O Grafy precisa ser uma ferramenta de acao, nao apenas de visualizacao. O grafo e a beleza visual atraem, mas o valor diario vem de busca, filtros, lembretes, qualidade de dados, importacao, sugestoes de conexao e fluxos de introducao.

## 3. Referencias pesquisadas e aprendizados

### Dex

Aprendizado: personal CRM precisa de rotina. O produto deve ajudar a lembrar de manter contato, registrar contexto e criar follow-ups. Para o Grafy, isso vira "proximas acoes" e "saude da relacao".

Aplicar no Grafy:

- Campo `last_interaction_at`.
- Campo `next_follow_up_at`.
- Lembretes por contato.
- Dashboard "contatos esfriando".
- Score simples de relacionamento.

### Covve

Aprendizado: contatos ficam melhores quando ha enriquecimento, scanner/cartao, lembretes e atualizacao continua. Para o Grafy, importacao nao pode ser so "jogar dados no banco"; precisa ter limpeza, enriquecimento e fila de revisao.

Aplicar no Grafy:

- Central de qualidade dos contatos.
- Wizard de importacao com preview.
- Sugestao de campos faltantes.
- Scanner/cartao de visita como future feature.
- Atualizacao periodica via fonte.

### Monica

Aprendizado: relacionamento pessoal/profissional tem historico, notas, eventos, lembretes e privacidade forte. Para o Grafy, notas e historico basico devem entrar cedo, mesmo que simples.

Aplicar no Grafy:

- Timeline do contato.
- Notas internas privadas.
- Historico de edicoes relevantes.
- Lembretes simples.
- Diferenca clara entre dado privado e dado publico.

### folk

Aprendizado: CRM moderno combina contatos, listas, pipelines, campos customizados e colaboracao. Para o Grafy, grupos compartilhados devem funcionar como "spaces" com campos, tags e permissoes proprias.

Aplicar no Grafy:

- Grupos como espacos de trabalho.
- Views salvas por grupo.
- Campos customizados escopados por usuario ou grupo.
- Listas/pipelines opcionais no futuro.
- Permissoes por papel no grupo.

### Affinity

Aprendizado: "relationship intelligence" ganha forca quando cruza emails, reunioes, historico e caminhos de apresentacao. Para o MVP, nao integrar email ainda, mas modelar desde cedo "caminhos de conexao" e "forca da relacao".

Aplicar no Grafy:

- Relacoes `conhece`, `trabalhou_com`, `membro_do_mesmo_grupo`, `tag_em_comum`.
- Warm intro simples: "quem pode apresentar X para Y".
- Caminhos no grafo entre pessoas.
- Peso da relacao.

### Attio

Aprendizado: CRMs modernos sao flexiveis e baseados em objetos/atributos. Para o Grafy, campos customizados devem ser entidade de primeira classe, nao improviso em JSON sem governanca.

Aplicar no Grafy:

- `custom_fields` com tipo, opcoes, escopo e validacao.
- `custom_field_values` indexavel.
- Filtros baseados em campos customizados.
- Views salvas com colunas/filtros.

## 4. Bibliotecas e stack recomendada

### Frontend

- React + TypeScript + Vite.
- Tailwind CSS + shadcn/ui ou sistema equivalente ja adotado no Lovable.
- React Router para rotas.
- TanStack Query para cache/sincronizacao cliente-servidor.
- Zustand para estado local leve.
- Zod + React Hook Form para formularios.
- Lucide React para icones.
- Framer Motion para microinteracoes controladas.

### Backend/BaaS

- Supabase Auth para Google login e magic link.
- Supabase Postgres para dados relacionais.
- Supabase Row Level Security em todas as tabelas sensiveis.
- Supabase Storage para avatars/fotos.
- Supabase Edge Functions para Google Contacts, jobs de importacao, dedupe e futuras chamadas de IA.

### Busca

MVP:

- Postgres full-text search com `tsvector` para nome, descricao, tags, problema que resolve e demanda atual.
- `pg_trgm` para tolerancia a erro de digitacao.
- Filtros estruturados por tag, fonte, DDD, grupo, tipo e campos customizados.

Fase 2:

- `pgvector` para busca semantica e matching demanda-solucao.

### Grafo

Recomendacao principal para o Grafy: Sigma.js + Graphology.

Motivo:

- Melhor encaixe para visualizacao premium de rede, estilo constelacao, performance WebGL e layouts de grafos.
- O grafo do Grafy nao precisa ser editor de fluxo; precisa ser exploravel, filtravel, bonito e performatico.

Alternativas:

- React Flow: bom para diagramas editaveis e fluxos, mas nao e o melhor centro para rede grande de contatos.
- Cytoscape.js: excelente para analise de grafos e algoritmos, visual menos premium por padrao.
- D3: maximo controle visual, maior custo de implementacao.

Sugestao:

- Usar Sigma.js/Graphology no app principal.
- Criar camada propria `graphAdapter` para permitir trocar biblioteca no futuro.

### Chat e IA

MVP:

- Chat com busca estruturada sem LLM obrigatorio.
- Interpretar queries simples com heuristicas: "quem resolve X", "quem busca Y", "quem e de DDD 11", "quem tem tag tecnologia".
- Retornar cards de contatos, filtros aplicados e sugestoes de acao.

Fase 2:

- CopilotKit ou AG-UI para padrao de copiloto com tools.
- Tools planejadas: `searchContacts`, `findIntroPaths`, `suggestMerge`, `suggestTags`, `draftIntro`, `createFollowUp`, `updateContactDraft`.
- Qualquer alteracao de dados feita por IA precisa de confirmacao explicita do usuario.

### PWA/offline

- `vite-plugin-pwa` com Workbox.
- App shell cache.
- Runtime cache para assets estaticos.
- IndexedDB via Dexie para cache local de contatos ja carregados.
- Fila offline para criacao/edicao manual.
- Sincronizacao ao reconectar.
- No MVP, offline pode ser read-only para dados importados, com edicoes locais em fila somente quando seguro.

### Qualidade e testes

- Vitest para unidades.
- Testing Library para componentes.
- Playwright para fluxos reais: landing, auth, onboarding, importar CSV, criar contato, filtro, grafo e perfil publico.
- Storybook opcional para componentes complexos.
- Axe/Playwright ou pa11y para acessibilidade basica.

## 5. Ideias de produto para acrescentar ao PRD

### Central de inteligencia

Uma area fixa no dashboard com:

- Contatos com dados incompletos.
- Duplicados pendentes.
- Novas oportunidades demanda-solucao.
- Pessoas com follow-up atrasado.
- Top tags emergentes.
- Grupos com mais atividade.

### Match demanda-solucao

Criar uma logica inicial simples:

- Se contato A demanda uma tag que contato B resolve, sugerir "potencial complementaridade".
- Se ambos estao no mesmo grupo, aumentar score.
- Se DDD/cidade igual, aumentar score local.
- Se tags similares, aumentar score.

Resultado esperado:

- Card "Ana busca CTO; Bruno resolve recrutamento tech".
- Botao "criar nota", "marcar introducao" ou "salvar oportunidade".

### Workflow de introducao

Fluxo simples:

1. Usuario encontra duas pessoas complementares.
2. Clica em "Preparar introducao".
3. App gera um texto-base de apresentacao.
4. Usuario copia ou envia manualmente.
5. Historico registra que uma introducao foi preparada.

### Relacao e proximidade

Adicionar score simples por contato:

- Recencia de interacao.
- Quantidade de notas.
- Grupos em comum.
- Tags em comum.
- Se e perfil publico vinculado.

Nao chamar de "score absoluto"; chamar de "proximidade estimada" para evitar falsa precisao.

### Views salvas

Permitir salvar filtros como:

- "Investidores em SP"
- "Fornecedores com DDD 11"
- "Pessoas buscando marketing"
- "Duplicados para revisar"
- "Perfis publicos com fit"

### Perfil publico com controle granular

Configuracao "quero ser visto" deve ter opcoes:

- Visivel para todos os usuarios da plataforma.
- Visivel apenas em grupos dos quais participo.
- Ocultar telefone.
- Ocultar email.
- Exibir apenas links selecionados.

### Auditoria de privacidade

Toda tela que cruza dados privados e publicos deve indicar de forma visual:

- Privado
- Grupo
- Publico
- Vinculado a usuario real

O usuario nunca deve ficar em duvida se esta editando algo privado ou compartilhado.

## 6. Fontes principais consultadas

- Dex: https://getdex.com/
- Covve: https://www.covve.com/
- Monica: https://www.monicahq.com/
- folk: https://www.folk.app/
- Affinity: https://www.affinity.co/
- Attio: https://attio.com/
- Google People API: https://developers.google.com/people/api/rest
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase Vector/pgvector: https://supabase.com/docs/guides/ai/vector-columns
- PostgreSQL Full Text Search: https://www.postgresql.org/docs/current/textsearch.html
- React Flow / xyflow: https://reactflow.dev/
- Sigma.js: https://www.sigmajs.org/
- Cytoscape.js: https://js.cytoscape.org/
- Workbox: https://developer.chrome.com/docs/workbox
- PWA guidance: https://web.dev/learn/pwa/
- CopilotKit: https://docs.copilotkit.ai/
- AG-UI: https://docs.ag-ui.com/
- OpenAPI: https://spec.openapis.org/oas/latest.html
- Swagger UI: https://swagger.io/tools/swagger-ui/
