# Grafy

Protótipo funcional do Grafy, um CRM de networking inteligente para organizar contatos, visualizar relações em grafo, encontrar oportunidades e preparar a evolução para Supabase/Google Contacts/IA.

## Rodar localmente

```bash
npm install
npm run dev -- --port 5173
```

Abra:

```text
http://127.0.0.1:5173/
```

## Deploy público

URL para apresentação e testes:

```text
https://leninn-marinho-rodrigues.github.io/grafy-cogmo-prototype/
```

Este deploy é demonstrativo. Cada pessoa pode usar o próprio email na tela inicial para criar/entrar em um workspace salvo no navegador dela. A opção **Ajustes -> Apagar conta de teste** limpa os dados locais daquela pessoa. Login real compartilhado com Supabase/Google entra na próxima fase.

## O que já funciona

- Login demonstrativo com sessão local.
- Landing/login com canvas animado de rede, spotlight seguindo o mouse, preview de produto, seções comerciais separadas e transições com `motion`.
- Dashboard com contatos, tags, perfis públicos, duplicados e oportunidades.
- CRUD inicial de contatos: criar, editar campos principais, excluir e tornar público.
- Importação CSV com preview e normalização básica.
- Status de Google/Gmail Contacts com checagem de `VITE_GOOGLE_CLIENT_ID`.
- Área de enriquecimento LinkedIn seguro, abrindo pesquisas assistidas para revisão humana.
- Tela de conectores com plano técnico para Google Contacts, LinkedIn oficial/assistido, Meetup GraphQL e OpenAPI.
- Sugestão de duplicados por email ou telefone.
- Merge aprovado pelo usuário, sem merge automático.
- Grafo interno com contatos, tags, DDDs, fontes, grupos, matches e camada animada de conexões.
- Rede pública com opt-in.
- Grupos compartilhados demonstrativos.
- Campos personalizados demonstrativos.
- Chat de busca estruturada com respostas por tags, demandas, problemas resolvidos, DDD e duplicados.
- PWA básico com manifest, service worker e página offline.
- Persistência local no navegador.
- Auditoria de lacunas do PRD em `docs/PRD-GAP-AUDIT-2026-05-28.md`.

## Validação feita

```bash
npm run build
```

Smoke test no navegador:

- Dashboard carregou.
- Base inicial com 12 contatos carregou.
- Grafo renderizou 38 nós.
- Chat respondeu "quem presta serviço de limpeza?" com Rafael Nunes.
- Importação CSV adicionou Paula Andrade.
- Service worker ficou ativo.
- Console atual sem erros.

## Próximas fases

1. Ligar Supabase Auth e Postgres.
2. Criar migrations e RLS.
3. Configurar Google OAuth com `VITE_GOOGLE_CLIENT_ID` e origem autorizada.
4. Trocar persistência local por Supabase.
5. Implementar Google Contacts via Google People API em backend seguro.
6. LinkedIn: usar apenas APIs oficiais aprovadas ou pesquisa assistida com revisão humana; não automatizar scraping logado.
7. Meetup: criar conector OAuth/GraphQL quando houver acesso/token, trazendo eventos, grupos, temas e participantes autorizados.
8. Evoluir o grafo para Sigma.js/Graphology.
9. Adicionar OpenAPI/Swagger.
10. Adicionar CopilotKit/AG-UI com tools de leitura e escrita confirmada.

## Conectores e limites importantes

- **Google Contacts**: caminho recomendado para contatos reais do Gmail. Exige Google OAuth, escopo de contatos, origem autorizada e backend/Supabase Edge Function para proteger tokens.
- **LinkedIn**: bom para login/perfil próprio e enriquecimento profissional revisado. A plataforma não deve depender de scraping automático nem prometer acesso livre a contatos, cargos ou conexões sem permissão oficial.
- **Meetup**: pode enriquecer o grafo com eventos, grupos, interesses, localidade e participantes quando houver OAuth/GraphQL autorizado.
- **Enriquecimento seguro**: toda fonte externa deve entrar como preview, sugerir merge e pedir aprovação antes de alterar contatos.
