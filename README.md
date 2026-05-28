# Grafy

Prototipo funcional do Grafy, um CRM de networking inteligente para organizar contatos, visualizar relacoes em grafo, encontrar oportunidades e preparar a evolucao para Supabase/Google Contacts/IA.

## Rodar localmente

```bash
npm install
npm run dev -- --port 5173
```

Abra:

```text
http://127.0.0.1:5173/
```

## Deploy publico

URL para apresentacao e testes:

```text
https://leninn-marinho-rodrigues.github.io/grafy-cogmo-prototype/
```

Este deploy e demonstrativo. Cada pessoa pode usar o proprio email na tela inicial para criar/entrar em um workspace salvo no navegador dela. A opcao **Ajustes -> Apagar conta de teste** limpa os dados locais daquela pessoa. Login real compartilhado com Supabase/Google entra na proxima fase.

## O que ja funciona

- Login demonstrativo com sessao local.
- Landing/login com canvas animado de rede, spotlight seguindo o mouse, preview de produto, secoes comerciais separadas e transicoes com `motion`.
- Dashboard com contatos, tags, perfis publicos, duplicados e oportunidades.
- CRUD inicial de contatos: criar, editar campos principais, excluir e tornar publico.
- Importacao CSV com preview e normalizacao basica.
- Status de Google/Gmail Contacts com checagem de `VITE_GOOGLE_CLIENT_ID`.
- Area de enriquecimento LinkedIn seguro, abrindo pesquisas assistidas para revisao humana.
- Tela de conectores com plano tecnico para Google Contacts, LinkedIn oficial/assistido, Meetup GraphQL e OpenAPI.
- Sugestao de duplicados por email ou telefone.
- Merge aprovado pelo usuario, sem merge automatico.
- Grafo interno com contatos, tags, DDDs, fontes, grupos, matches e camada animada de conexoes.
- Rede publica com opt-in.
- Grupos compartilhados demonstrativos.
- Campos personalizados demonstrativos.
- Chat de busca estruturada com respostas por tags, demandas, problemas resolvidos, DDD e duplicados.
- PWA basico com manifest, service worker e pagina offline.
- Persistencia local no navegador.
- Auditoria de lacunas do PRD em `docs/PRD-GAP-AUDIT-2026-05-28.md`.

## Validacao feita

```bash
npm run build
```

Smoke test no navegador:

- Dashboard carregou.
- Base inicial com 12 contatos carregou.
- Grafo renderizou 38 nos.
- Chat respondeu "quem presta servico de limpeza?" com Rafael Nunes.
- Importacao CSV adicionou Paula Andrade.
- Service worker ficou ativo.
- Console atual sem erros.

## Proximas fases

1. Ligar Supabase Auth e Postgres.
2. Criar migrations e RLS.
3. Configurar Google OAuth com `VITE_GOOGLE_CLIENT_ID` e origem autorizada.
4. Trocar persistencia local por Supabase.
5. Implementar Google Contacts via Google People API em backend seguro.
6. LinkedIn: usar apenas APIs oficiais aprovadas ou pesquisa assistida com revisao humana; nao automatizar scraping logado.
7. Meetup: criar conector OAuth/GraphQL quando houver acesso/token, trazendo eventos, grupos, temas e participantes autorizados.
8. Evoluir o grafo para Sigma.js/Graphology.
9. Adicionar OpenAPI/Swagger.
10. Adicionar CopilotKit/AG-UI com tools de leitura e escrita confirmada.

## Conectores e limites importantes

- **Google Contacts**: caminho recomendado para contatos reais do Gmail. Exige Google OAuth, escopo de contatos, origem autorizada e backend/Supabase Edge Function para proteger tokens.
- **LinkedIn**: bom para login/perfil proprio e enriquecimento profissional revisado. A plataforma nao deve depender de scraping automatico nem prometer acesso livre a contatos, cargos ou conexoes sem permissao oficial.
- **Meetup**: pode enriquecer o grafo com eventos, grupos, interesses, localidade e participantes quando houver OAuth/GraphQL autorizado.
- **Enriquecimento seguro**: toda fonte externa deve entrar como preview, sugerir merge e pedir aprovacao antes de alterar contatos.
