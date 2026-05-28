# PRD enriquecido para execucao Codex - Grafy

Versao: 1.0
Data: 2026-05-28
Produto: Grafy
Origem: PRD enviado pelo usuario + analise do site publicado + pesquisa de referencias

## 1. Missao do produto

Grafy e um webapp PWA-first para gestao inteligente de contatos, networking e comunidades. O produto transforma contatos privados, grupos compartilhados e perfis publicos opcionais em um mapa visual de relacoes, demandas, solucoes e oportunidades.

O objetivo nao e ser apenas uma agenda bonita. O Grafy deve responder perguntas acionaveis:

- Quem na minha rede resolve este problema?
- Quem esta demandando algo que outra pessoa oferece?
- Quem pode me apresentar alguem?
- Quais grupos ou tags revelam oportunidades escondidas?
- Quais contatos precisam de follow-up?

## 2. Estado atual observado

O site publicado em `https://grafyy.lovable.app/` ja possui uma landing visualmente alinhada ao conceito: dark mode, linguagem premium, grafo/constelacao, CTA e tela de auth.

Porem, para virar produto real, ainda faltam:

- App autenticado navegavel e funcional.
- Dashboard real.
- CRUD de contatos.
- Banco Supabase com RLS.
- Importacao CSV/manual/Google Contacts real.
- Dedupe com aprovacao.
- Grafo real derivado de dados.
- Grupos compartilhados.
- Perfil publico.
- Chat com busca estruturada.
- Service worker e offline basico.
- Documentacao OpenAPI.

Decisao: manter a direcao visual atual, mas reconstruir/continuar com fundacao tecnica verificavel.

## 3. Personas e papeis

### Visitante

- Acessa landing e login.
- Nao ve dados privados, grupos ou rede publica detalhada.

### Usuario padrao

- Gerencia contatos privados.
- Importa contatos.
- Cria tags e campos customizados pessoais.
- Usa busca, grafo e chat.
- Pode ativar/desativar perfil publico.

### Usuario admin/plano superior

- Tudo do usuario padrao.
- Cria grupos compartilhados.
- Convida membros.
- Gerencia campos customizados de grupo.
- Gerencia base compartilhada do grupo.

### Membro de grupo

- Acessa grupos em que foi convidado.
- Consulta contatos/perfis do grupo conforme permissao.
- Usa busca e grafo do grupo.

## 4. Escopos de dados

O produto deve tratar contexto como regra central.

### Escopo pessoal

Dados privados de um usuario. So o dono acessa, exceto dados que ele explicitamente torna publicos.

### Escopo de grupo

Dados compartilhados dentro de um grupo. O grupo possui admins, membros, contatos, tags, campos e grafo proprios.

### Escopo publico

Perfil publico opcional de usuarios da plataforma. Nunca deve expor contatos privados importados pelo usuario.

## 5. Principios obrigatorios

- Privacidade primeiro.
- Nenhum merge automatico no MVP.
- Todo dado sensivel protegido por RLS.
- Todo contexto deve ser visivel na UI: privado, grupo, publico ou vinculado a usuario real.
- O grafo e exploravel, nao editavel diretamente.
- IA nunca altera dados sem confirmacao.
- Dados de demo nunca devem se misturar com dados reais.
- Onde nao houver implementacao real, usar "em breve" de forma honesta.

## 6. Stack recomendada

### Frontend

- React + TypeScript + Vite.
- Tailwind CSS.
- shadcn/ui ou componentes equivalentes ja existentes.
- React Router.
- TanStack Query.
- Zustand para estado local.
- React Hook Form + Zod.
- Lucide React.
- Framer Motion com uso moderado.

### Backend

- Supabase Auth.
- Supabase Postgres.
- Supabase Row Level Security.
- Supabase Storage.
- Supabase Edge Functions.

### Busca

- Postgres full-text search.
- `pg_trgm` para busca tolerante.
- `pgvector` em fase futura para busca semantica.

### Grafo

- Sigma.js + Graphology como escolha preferencial.
- Criar camada `graphAdapter` para isolar biblioteca visual.
- Layouts: ForceAtlas2, noverlap e clustering por tipo/contexto.

### PWA

- `vite-plugin-pwa` + Workbox.
- IndexedDB/Dexie para cache local.
- App shell cache.
- Sync queue para operacoes offline simples.

## 7. Arquitetura de alto nivel

Camadas:

1. `ui`: componentes visuais, layouts, formularios, grafo.
2. `features`: contatos, importacao, grupos, rede publica, chat, dashboard.
3. `services`: clients Supabase, Google Contacts, CSV parser, graph builder, search.
4. `data`: hooks TanStack Query, mutations, cache, offline queue.
5. `db`: migrations SQL, policies RLS, seed demo separado.
6. `edge-functions`: importacao Google, dedupe, chat/retrieval, OpenAPI.

Separar dominio por pasta:

- `src/features/auth`
- `src/features/onboarding`
- `src/features/dashboard`
- `src/features/contacts`
- `src/features/import`
- `src/features/graph`
- `src/features/groups`
- `src/features/public-network`
- `src/features/profile`
- `src/features/chat`
- `src/features/settings`
- `src/features/custom-fields`

## 8. Modelo de dados recomendado

### Tabelas de identidade e perfil

- `profiles`
  - `id uuid primary key references auth.users(id)`
  - `display_name text`
  - `avatar_url text`
  - `bio text`
  - `is_public boolean default false`
  - `public_visibility text default 'private'`
  - `created_at timestamptz`
  - `updated_at timestamptz`

- `public_profiles`
  - `user_id uuid primary key references profiles(id)`
  - `headline text`
  - `description text`
  - `problem_solves text`
  - `current_demand text`
  - `whatsapp text`
  - `instagram text`
  - `linkedin text`
  - `custom_url text`
  - `search_vector tsvector`

### Contatos privados

- `contacts`
  - `id uuid primary key`
  - `owner_user_id uuid references profiles(id)`
  - `linked_user_id uuid null references profiles(id)`
  - `name text not null`
  - `avatar_url text`
  - `description text`
  - `current_demand text`
  - `problem_solves text`
  - `notes text`
  - `source_label text`
  - `source_type text`
  - `last_interaction_at timestamptz`
  - `next_follow_up_at timestamptz`
  - `created_at timestamptz`
  - `updated_at timestamptz`
  - `deleted_at timestamptz null`

- `contact_emails`
  - `id uuid primary key`
  - `contact_id uuid references contacts(id)`
  - `email text`
  - `normalized_email text`
  - `label text`
  - `is_primary boolean`

- `contact_phones`
  - `id uuid primary key`
  - `contact_id uuid references contacts(id)`
  - `phone text`
  - `normalized_phone text`
  - `ddd text`
  - `label text`
  - `is_primary boolean`

- `contact_links`
  - `id uuid primary key`
  - `contact_id uuid references contacts(id)`
  - `kind text`
  - `url text`
  - `label text`

### Tags

- `tags`
  - `id uuid primary key`
  - `owner_user_id uuid null`
  - `group_id uuid null`
  - `name text`
  - `slug text`
  - `color text`
  - `usage_count int default 0`

- `contact_tags`
  - `contact_id uuid references contacts(id)`
  - `tag_id uuid references tags(id)`
  - `created_by uuid references profiles(id)`

Regra: tag pessoal tem `owner_user_id`; tag de grupo tem `group_id`.

### Grupos

- `groups`
  - `id uuid primary key`
  - `owner_user_id uuid references profiles(id)`
  - `name text`
  - `description text`
  - `avatar_url text`
  - `created_at timestamptz`
  - `updated_at timestamptz`

- `group_members`
  - `group_id uuid references groups(id)`
  - `user_id uuid references profiles(id)`
  - `role text check role in ('admin','member','viewer')`
  - `status text check status in ('invited','active','removed')`
  - `invited_by uuid`

- `group_contacts`
  - `id uuid primary key`
  - `group_id uuid references groups(id)`
  - `contact_id uuid references contacts(id)`
  - `added_by uuid references profiles(id)`
  - `visibility text default 'group'`

### Campos customizados

- `custom_fields`
  - `id uuid primary key`
  - `owner_user_id uuid null`
  - `group_id uuid null`
  - `scope text check scope in ('user','group')`
  - `name text`
  - `key text`
  - `field_type text check field_type in ('short_text','long_text','number','select','checkbox','multiselect','date')`
  - `options jsonb`
  - `is_filterable boolean default true`
  - `is_required boolean default false`
  - `sort_order int default 0`

- `custom_field_values`
  - `id uuid primary key`
  - `custom_field_id uuid references custom_fields(id)`
  - `contact_id uuid references contacts(id)`
  - `value_text text`
  - `value_number numeric`
  - `value_boolean boolean`
  - `value_date date`
  - `value_json jsonb`

### Importacao

- `import_jobs`
  - `id uuid primary key`
  - `owner_user_id uuid references profiles(id)`
  - `source_type text`
  - `status text`
  - `total_rows int`
  - `imported_count int`
  - `duplicate_count int`
  - `error_count int`
  - `created_at timestamptz`
  - `completed_at timestamptz`

- `import_rows`
  - `id uuid primary key`
  - `import_job_id uuid references import_jobs(id)`
  - `raw_payload jsonb`
  - `normalized_payload jsonb`
  - `status text`
  - `error_message text`

### Duplicidade e matching

- `merge_suggestions`
  - `id uuid primary key`
  - `owner_user_id uuid references profiles(id)`
  - `contact_a_id uuid references contacts(id)`
  - `contact_b_id uuid references contacts(id)`
  - `reason text`
  - `confidence numeric`
  - `status text check status in ('pending','approved','ignored','reviewed')`
  - `created_at timestamptz`
  - `resolved_at timestamptz`

- `opportunity_matches`
  - `id uuid primary key`
  - `scope_type text check scope_type in ('user','group','public')`
  - `scope_id uuid`
  - `contact_a_id uuid`
  - `contact_b_id uuid`
  - `match_type text`
  - `score numeric`
  - `explanation text`
  - `status text default 'suggested'`

### Grafo

- `graph_edges`
  - `id uuid primary key`
  - `scope_type text`
  - `scope_id uuid`
  - `source_node_id text`
  - `target_node_id text`
  - `source_type text`
  - `target_type text`
  - `edge_type text`
  - `weight numeric default 1`
  - `metadata jsonb`

Observacao: no MVP, `graph_edges` pode ser materializada por job ou gerada sob demanda. Criar tabela ajuda performance e facilita filtros.

### Chat

- `chat_threads`
  - `id uuid primary key`
  - `owner_user_id uuid references profiles(id)`
  - `scope_type text`
  - `scope_id uuid`
  - `title text`
  - `created_at timestamptz`

- `chat_messages`
  - `id uuid primary key`
  - `thread_id uuid references chat_threads(id)`
  - `role text check role in ('user','assistant','system','tool')`
  - `content text`
  - `metadata jsonb`
  - `created_at timestamptz`

## 9. Regras de RLS

Implementar RLS desde a primeira migration.

Politicas base:

- Usuario so acessa `contacts` onde `owner_user_id = auth.uid()`.
- Usuario so acessa `groups` se for membro ativo em `group_members`.
- Admin de grupo pode editar grupo, membros, campos e contatos do grupo.
- Membro pode ler dados do grupo e editar apenas permissao definida.
- `public_profiles` so aparecem quando `profiles.is_public = true`.
- Storage de avatars deve ter bucket separado e policies por dono.

Criar testes de RLS:

- Usuario A nao le contato de usuario B.
- Membro fora do grupo nao le contatos do grupo.
- Perfil publico aparece sem expor contatos privados.
- Admin pode convidar membro; membro comum nao pode.

## 10. Fluxos principais

### Onboarding

1. Login via Google ou magic link.
2. Completar perfil.
3. Escolher visibilidade publica.
4. Escolher primeira importacao: Google, CSV ou manual.
5. Ver dashboard com primeiros insights.

### Importacao Google Contacts

Requisitos:

- Login Google nao basta: solicitar escopo da People API para ler contatos.
- Executar importacao por Edge Function.
- Normalizar emails, telefones e DDD.
- Criar `import_job`.
- Exibir preview, quantidade de contatos, possiveis duplicados e erros.
- Salvar apenas apos confirmacao do usuario.

### Importacao CSV

Requisitos:

- Upload CSV.
- Preview das primeiras linhas.
- Mapeamento de colunas para campos do Grafy.
- Validacao de email/telefone.
- Criacao de tags e campos customizados durante o mapping.
- Tela de resultado com importados, erros e duplicados.

### Cadastro manual

Campos minimos:

- Nome.
- Email(s).
- Telefone(s).
- Tags.
- Descricao.
- Demanda atual.
- Problema que resolve.
- Links.
- Campos customizados.

### Dedupe

Critérios MVP:

- Email normalizado igual.
- Telefone normalizado igual.

Fluxo:

1. Sistema cria sugestao.
2. Usuario revisa comparativo lado a lado.
3. Usuario aprova merge, ignora ou edita manualmente.
4. Ao aprovar, app preserva fontes, tags, notas e historico.

## 11. Grafo - especificacao visual e funcional

### Tipos de nos

- Pessoa/contato privado.
- Usuario da plataforma.
- Perfil publico.
- Grupo.
- Tag.
- Fonte de importacao.
- DDD.
- Demanda.
- Problema resolvido.
- Empresa/organizacao.

### Tipos de arestas

- `has_tag`
- `imported_from`
- `belongs_to_group`
- `has_public_profile`
- `demands`
- `solves`
- `has_ddd`
- `linked_to_user`
- `potential_match`
- `same_group`
- `same_tag`

### Interacoes

- Zoom/pan.
- Clique em no abre painel lateral.
- Hover destaca vizinhos.
- Busca textual centraliza no.
- Filtros alteram visibilidade.
- Layout pode ser reprocessado.
- Usuario pode mover nos localmente.
- Nao permitir criar/remover arestas pelo canvas no MVP.

### Visual

- Fundo escuro profundo.
- Nos com brilho sutil, sem exagero.
- Pessoas maiores que tags/fontes.
- Tags com cor propria.
- DDDs em tom neutro.
- Potenciais matches com aresta destacada.
- Perfis publicos com anel visual.
- Grupos com halo ou cluster.

### Performance

- Para ate 500 nos: render completo.
- Para 500-3000 nos: clustering e filtros ativos.
- Acima de 3000: carregar subgrafo por busca/filtro, nao tudo de uma vez.

## 12. Busca e inteligencia

### Busca global

Indexar:

- Nome.
- Descricao.
- Tags.
- Problema que resolve.
- Demanda atual.
- DDD.
- Emails.
- Telefones.
- Links sociais.
- Campos customizados filtraveis.

### Respostas esperadas

Para "quem presta servico de limpeza":

- Buscar por tag, descricao, problema que resolve e campos.
- Retornar cards ranqueados.
- Mostrar por que cada resultado apareceu.
- Oferecer abrir grafo filtrado.

Para "quem busca marketing":

- Buscar em demanda atual.
- Cruzar com pessoas que resolvem marketing.
- Sugerir oportunidades.

### Matching complementar

Score inicial:

- +40 se demanda de A cruza tag/problema resolvido de B.
- +20 se estao no mesmo grupo.
- +10 se DDD/cidade igual.
- +10 se tags em comum.
- +10 se B e perfil publico ativo.
- +10 se houve interacao recente.

Exibir explicacao legivel, nunca apenas score.

## 13. Chat preparado para IA

### MVP sem LLM obrigatorio

O chat deve funcionar como interface de busca conversacional estruturada.

Exemplos:

- "Quem resolve marketing?"
- "Quem esta buscando investidor?"
- "Mostre contatos do DDD 11 com tag tecnologia."
- "Quais duplicados preciso revisar?"
- "Quem eu deveria procurar esta semana?"

### Fase com IA

Arquitetura compatível com CopilotKit/AG-UI:

- Estado legivel pelo copiloto: filtros ativos, escopo ativo, contato aberto.
- Tools de leitura: `searchContacts`, `getContact`, `getGraphNeighborhood`, `findOpportunityMatches`.
- Tools de escrita com confirmacao: `updateContact`, `addTag`, `createFollowUp`, `approveMerge`.
- Toda sugestao de escrita deve gerar diff antes de aplicar.

## 14. Grupos compartilhados

### MVP

- Criar grupo.
- Editar nome/descricao.
- Convidar membro por email.
- Definir papel: admin, member, viewer.
- Adicionar contatos ao grupo.
- Criar campos customizados do grupo.
- Buscar dentro do grupo.
- Ver grafo do grupo.

### Regras

- Contato pessoal nao entra automaticamente no grupo.
- Ao adicionar contato ao grupo, mostrar o que sera compartilhado.
- Contato de grupo deve ter contexto visual proprio.
- Membro removido perde acesso imediatamente.

## 15. Rede publica

### Perfil publico

Campos:

- Nome.
- Foto.
- Headline.
- Descricao.
- Tags.
- Problema que resolve.
- Demanda atual.
- WhatsApp, Instagram, LinkedIn e URL customizada, exibidos apenas se preenchidos.

### Descoberta

- Lista de cards.
- Filtros por tag, DDD, demanda e problema resolvido.
- Grafo publico.
- Indicador quando um perfil publico corresponde a contato privado do usuario.

### Privacidade

Nunca exibir email/telefone por padrao.

Configuracoes:

- Publico na plataforma.
- Visivel apenas em grupos.
- Ocultar telefone.
- Ocultar email.
- Mostrar/ocultar links individuais.

## 16. PWA e mobile-first

### Mobile

- Bottom tab bar: Inicio, Contatos, Grafo, Rede, Chat.
- Botao flutuante ou acao primaria para adicionar/importar.
- Sheets para filtros.
- Painel de contato como drawer.
- Alvos de toque com minimo 44px.

### Desktop

- Sidebar persistente.
- Painel principal com listas/tabelas/grafo.
- Drawer lateral para detalhes.
- Atalhos de busca.

### PWA minimo verificavel

- Manifest completo.
- Icones 192, 512 e maskable.
- Service worker registrado.
- App shell offline.
- Pagina offline amigavel.
- Cache de contatos carregados.
- Sync ao reconectar.

## 17. API e OpenAPI

Criar rota `/docs` ou `/api/docs` com Swagger UI ou Redoc.

MVP de endpoints documentados:

- `GET /api/health`
- `GET /api/contacts`
- `POST /api/contacts`
- `GET /api/contacts/:id`
- `PATCH /api/contacts/:id`
- `GET /api/groups`
- `POST /api/groups`
- `GET /api/graph`
- `POST /api/import/csv`
- `POST /api/import/google`

Mesmo que a implementacao use Supabase diretamente no cliente, manter documentacao do contrato ajuda futuras integracoes.

## 18. Design system

### Tom visual

- Premium.
- Moderno.
- Levemente futurista.
- Dark mode padrao.
- Light mode funcional.
- Nada de visual exageradamente sci-fi.

### Componentes obrigatorios

- App shell mobile/desktop.
- Cards de contato.
- Chips de tags.
- Campo de busca global.
- Filtros por sheets/drawers.
- Tabela/lista de contatos.
- Painel de detalhe.
- Graph canvas.
- Empty states.
- Import wizard.
- Merge review.
- Chat panel.
- Public profile card.

### Microcopy

Usar portugues do Brasil, direto e moderno.

Exemplos:

- "Encontrar conexoes"
- "Preparar introducao"
- "Revisar duplicados"
- "Mostrar no grafo"
- "Adicionar demanda"
- "Tornar perfil visivel"

## 19. Roadmap executavel

### Fase 0 - Fundacao

Entregas:

- Repo React/Vite/TS ou ajuste da base Lovable.
- Supabase conectado por env vars.
- Layout app shell responsivo.
- Tema dark/light.
- Manifest PWA inicial.
- Rotas principais sem 404.

Gate:

- `npm run build` passa.
- Landing, auth e `/app` carregam.
- Mobile e desktop sem quebra visual.

### Fase 1 - Auth e onboarding

Entregas:

- Google login.
- Magic link.
- Perfil do usuario.
- Onboarding em etapas.
- Toggle de perfil publico.

Gate:

- Usuario novo cai no onboarding.
- Usuario existente cai no dashboard.
- Perfil publico desligado por padrao.

### Fase 2 - Banco, RLS e contatos

Entregas:

- Migrations Supabase.
- Policies RLS.
- CRUD de contatos.
- Emails/telefones/tags/links.
- Campos DDD calculados.
- Lista e detalhe.

Gate:

- Usuario A nao acessa dados de B.
- Criar/editar/excluir contato funciona.
- Busca por nome/tag/DDD funciona.

### Fase 3 - Importacao CSV e manual

Entregas:

- Wizard CSV.
- Mapeamento de colunas.
- Preview.
- Import jobs.
- Relatorio de importacao.

Gate:

- CSV com 100 linhas importa.
- Erros aparecem sem quebrar importacao toda.

### Fase 4 - Google Contacts

Entregas:

- OAuth com escopo People API.
- Edge Function de importacao.
- Normalizacao.
- Preview e confirmacao.

Gate:

- Usuario consegue importar contatos reais do Google.
- Tokens nao ficam expostos de forma indevida.

### Fase 5 - Duplicados

Entregas:

- Criacao de `merge_suggestions`.
- UI comparativa.
- Aprovar/ignorar/revisar.

Gate:

- Email/telefone igual gera sugestao.
- Nenhum merge automatico acontece.

### Fase 6 - Grafo interno

Entregas:

- Graph builder.
- Sigma.js/Graphology.
- Nos e arestas MVP.
- Filtros.
- Painel lateral.

Gate:

- Grafo renderiza contatos reais.
- Filtros alteram grafo.
- Clique em no abre detalhe.

### Fase 7 - Rede publica

Entregas:

- Perfil publico.
- Cards publicos.
- Busca/filtros.
- Grafo publico.
- Vinculo visual com contato privado.

Gate:

- Perfil publico so aparece quando opt-in esta ativo.
- Links sociais aparecem somente se preenchidos.

### Fase 8 - Grupos

Entregas:

- Criar grupo.
- Membros e papeis.
- Contatos de grupo.
- Campos customizados de grupo.
- Grafo do grupo.

Gate:

- Nao membro nao acessa grupo.
- Admin gerencia membros.

### Fase 9 - Chat

Entregas:

- UI de copiloto.
- Busca estruturada.
- Cards de resposta.
- Historico de mensagens.
- Preparacao para tools de IA.

Gate:

- Chat responde perguntas simples com dados reais.
- Resposta mostra criterios usados.

### Fase 10 - PWA/offline/docs/testes

Entregas:

- Service worker.
- Offline page.
- Cache IndexedDB.
- OpenAPI docs.
- Playwright smoke.
- QA mobile/desktop.

Gate:

- App instalavel.
- Offline abre shell e dados cacheados.
- `/docs` abre.
- Testes passam.

## 20. Checklist de aceite final

Produto:

- Landing bonita e coerente.
- Auth real.
- Onboarding real.
- Dashboard com dados reais.
- Contatos CRUD.
- Importacao CSV/manual/Google.
- Duplicados com aprovacao.
- Tags ilimitadas.
- Campos customizados.
- Grafo interno bonito e funcional.
- Rede publica com opt-in.
- Grupos compartilhados.
- Chat operacional para busca.
- PWA instalavel.
- OpenAPI/docs.

Tecnico:

- Build sem erro.
- TypeScript sem erros graves.
- RLS ativo.
- Dados privados protegidos.
- Mobile validado.
- Desktop validado.
- Console sem erros.
- Rotas sem 404 inesperado.
- Service worker registrado.
- Testes minimos passando.

## 21. Prompt de execucao recomendado para Codex

Use este prompt ao iniciar a implementacao:

Voce esta desenvolvendo o Grafy, um PWA-first de networking intelligence CRM em React, TypeScript e Supabase. Siga o arquivo `PRD-GRAFY-ENRIQUECIDO-PARA-CODEX.md` como contrato de execucao. Primeiro audite o repo atual, preserve o visual premium existente quando houver, implemente uma fase por vez e mantenha status verificavel. Nao misture dados demo com dados reais. Implemente RLS desde o inicio. Para cada fase, rode build/testes possiveis e registre o que foi validado. Nao marque uma fase como concluida sem criterio de aceite atendido.

## 22. Riscos principais

- Escopo grande demais para um unico ciclo.
- Google Contacts exige OAuth e possivel verificacao de app dependendo dos escopos.
- Grafo grande pode degradar performance se carregar tudo de uma vez.
- RLS mal feita pode vazar contatos privados.
- IA pode gerar confianca falsa se nao mostrar criterios.
- PWA offline pode criar conflitos de sincronizacao se edicao offline for liberada cedo demais.

Mitigacao:

- Implementar em fases.
- Comecar com CSV/manual antes de Google se auth estiver bloqueado.
- Usar subgrafos e filtros.
- Testar RLS com usuarios diferentes.
- Chat MVP baseado em busca estruturada.
- Offline read-only no primeiro release.

## 23. Decisoes de MVP recomendadas

Para fazer o projeto acontecer de verdade, o MVP deve ser mais estreito e muito bem acabado:

1. Auth + onboarding.
2. Contatos privados com tags, emails, telefones, DDD e links.
3. CSV/manual.
4. Google Contacts.
5. Dedupe por email/telefone.
6. Grafo interno premium.
7. Perfil publico opt-in.
8. Chat de busca estruturada.
9. PWA instalavel.

Grupos compartilhados entram logo depois como segunda grande entrega, porque aumentam muito a complexidade de RLS, UX e modelo de dados.

## 24. Conectores externos: LinkedIn e Meetup

### LinkedIn

O Grafy deve tratar LinkedIn como fonte sensivel e limitada por permissao oficial.

Regras:

- Nao implementar scraping automatico logado.
- Nao prometer importacao livre de conexoes, cargos ou historico profissional sem API aprovada.
- Usar APIs oficiais quando o app tiver produto/permissao liberado no LinkedIn Developer.
- No MVP, permitir enriquecimento assistido: abrir pesquisa, mostrar sugestao e pedir revisao humana antes de gravar.
- Dados sugeridos devem entrar como `pending_enrichment`, com origem, data e status de aprovacao.

Dados uteis quando autorizados:

- perfil proprio do usuario;
- link publico do perfil;
- headline/cargo revisado;
- empresa/organizacao revisada;
- areas de atuacao confirmadas pelo usuario.

### Meetup

Meetup pode enriquecer o grafo com contexto de comunidade e eventos.

Regras:

- Usar OAuth/token autorizado e GraphQL quando o acesso estiver disponivel.
- Priorizar eventos, grupos, temas, localidade e participantes autorizados.
- Nao misturar participantes de evento com contatos privados sem preview e aprovacao.
- Criar nos de evento, grupo, tema, local e fonte de importacao.

Relacoes sugeridas:

- participou de evento;
- pertence a grupo;
- tem interesse em tema;
- conheceu em evento;
- origem Meetup.

### Fluxo obrigatorio para qualquer conector

1. Conectar fonte com consentimento.
2. Importar para area de preview.
3. Normalizar emails, telefones, DDDs, nomes, tags e links.
4. Sugerir duplicados e matches.
5. Pedir aprovacao do usuario.
6. Gravar contatos, campos e arestas no grafo.
7. Registrar origem, timestamp e status de revisao.
