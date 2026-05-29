# Auditoria Funcional do PRD - Grafy

Data: 2026-05-28

URL auditada:

```text
https://leninn-marinho-rodrigues.github.io/grafy-cogmo-prototype/
```

## Resumo

O Grafy está online e navegável como protótipo demonstrativo. Ele já funciona bem para mostrar a ideia do produto, a landing, dashboard, contatos, CSV básico, grafo, rede pública com opt-in, grupos demonstrativos, chat estruturado e PWA inicial.

Ele ainda não cumpre o PRD como software completo de produção porque ainda não possui Supabase Auth, banco compartilhado, RLS, Google Contacts real, grupos multiusuário reais, API/OpenAPI real, sincronização offline e permissões reais.

## Validação executada

- `npm run build`: passou.
- Deploy GitHub Pages: publicado com sucesso.
- Console no navegador: sem erros relevantes durante smoke test.
- Service worker: registrado no escopo do deploy.
- Mobile: layout responsivo e navegação inferior aparecem em viewport mobile.
- Perfil público: fica privado por padrão na base inicial atual.

## Smoke test

| Fluxo | Resultado |
| --- | --- |
| Landing carrega | OK |
| Login demonstrativo local | OK |
| Dashboard carrega | OK |
| Lista de contatos carrega | OK |
| Criar contato manual | OK |
| Excluir contato | OK |
| Importar CSV exemplo | OK |
| Detectar duplicado por email/telefone | OK |
| Renderizar grafo | OK |
| Zoom do grafo sem rolar a página | OK |
| Cards da rede pública | OK |
| Chat responder buscas estruturadas | OK |
| Criar grupo demo | OK |
| Criar campo customizado demo | OK |
| Toggle de visibilidade do perfil | OK |
| Botão apagar conta de teste | OK |
| Service worker registra | OK |

## Matriz PRD x aplicativo

### Funciona como protótipo

- Landing/login visual premium com fundo animado.
- App shell desktop com sidebar.
- Navegação mobile com bottom tab bar.
- Dashboard com métricas de contatos, tags, públicos, duplicados e oportunidades.
- Lista de contatos com busca por texto e filtro por tag.
- Criação manual de contato.
- Edição de descrição, demanda, problema que resolve e tags.
- Exclusão de contato.
- Toggle de contato público/privado.
- CSV básico com preview e importação.
- DDD derivado do telefone.
- Sugestão de merge por email/telefone igual.
- Merge aprovado pelo usuário.
- Grafo interno derivado da base local.
- Filtros do grafo por texto, tags, fonte, tipo, DDD e grupo.
- Clique em nó de contato abre contexto.
- Rede pública demo com cards de contatos marcados como públicos.
- Perfil próprio editável.
- Chat estruturado por busca em contatos, tags, demandas, problemas, DDD e duplicados.
- Criação de grupo demonstrativo.
- Criação de campo customizado demonstrativo.
- Tela de conectores explicando Google, LinkedIn, Meetup e OpenAPI.
- PWA básico com manifest, service worker e offline page.

### Parcial ou demonstrativo

- Login: cria sessão local no navegador, não autentica de verdade.
- Multiusuário: cada pessoa vê seus dados locais no próprio navegador; não há banco compartilhado.
- Cadastro/criação de conta: existe como experiência demo, não como conta real.
- Magic link: botão entra sem senha real; não envia email.
- Google login: placeholder; não abre OAuth.
- Google Contacts: placeholder; não usa People API.
- LinkedIn: pesquisa assistida/links externos; sem API oficial integrada.
- Meetup: planejamento/conector futuro; sem OAuth/GraphQL real.
- Campos customizados: podem ser criados, mas ainda não aparecem em todos os formulários e filtros.
- Grupos: podem ser criados e exibidos, mas não há convite real, membros reais, permissões ou RLS.
- Rede pública: funciona localmente, mas ainda não é uma rede real entre usuários.
- Grafo: bonito e navegável, mas ainda é SVG/local; para escala maior deve evoluir para engine especializada.
- PWA: service worker registra, mas offline/sync/IndexedDB/conflitos ainda não estão completos.
- OpenAPI/Swagger: existe como plano/documentação, não como rota `/docs` real.
- Chat: funciona como busca estruturada, não como IA/CopilotKit/AG-UI com tools.
- Onboarding: há faixa visual no dashboard, mas não há fluxo persistido em etapas.

### Não implementado ainda

- Supabase Auth.
- Supabase Postgres.
- Row Level Security.
- Supabase Storage.
- Migrations e schema real.
- Usuários reais separados no backend.
- Permissões reais por papel.
- Admin de grupo real.
- Convite/remoção de membros.
- Import jobs persistidos.
- Upload CSV com mapeamento completo de colunas.
- Preview de importação com aprovação antes de gravar.
- Google Contacts real via Edge Function.
- API `/docs` ou `/api/docs` com Swagger/Redoc.
- Endpoints REST documentados funcionando.
- Cache IndexedDB/Dexie.
- Sync queue offline.
- Light mode completo.
- Exportação/portabilidade.
- Relationship strength score.
- Follow-up queue.
- Timeline de interações por contato.
- Modo evento completo.
- Matches explicáveis com score detalhado.
- Subgrafos salvos.
- Grafo público separado real.
- Vínculo automático entre contato privado e usuário real da plataforma.

## Pontos antes de apresentar como MVP real

1. Trocar login demo por Supabase Auth.
2. Persistir contatos em Supabase com RLS.
3. Implementar CRUD real com usuário dono.
4. Melhorar CSV para wizard com preview antes de gravar.
5. Implementar grupos com membros e permissões reais ou deixar explicitamente como demo.
6. Criar `/docs` ou `/api/docs` real.
7. Validar PWA offline além do registro do service worker.
8. Separar dados de demonstração, staging e produção.

## Veredito

O app está bom para demonstração conceitual e protótipo navegável.

Ele não está pronto para ser apresentado como software funcional completo conforme o PRD. Para colegas e liderança, a formulação correta é:

> Protótipo online do Grafy, com UX, grafo, contatos, importação CSV demo, chat estruturado e fluxo local. A próxima etapa é ligar autenticação e banco real com Supabase e transformar os fluxos demo em produto multiusuário.
