# Auditoria de conformidade do PRD - Grafy

Data: 2026-06-02
Escopo: PRD original enviado pelo usuário + `PRD-GRAFY-ENRIQUECIDO-PARA-CODEX.md` + estado atual do app React/Vite.

## Veredito executivo

O Grafy já está bom como protótipo apresentável: tem três landings, cadastro/onboarding orientado por público, login Google configurável, importação real via Google People API quando o OAuth está ativo, importação por Excel/CSV/JSON, Apple vCard/.ics, contatos locais, grafo visual, filtros inteligentes, grupos/pastas, rede pública local, chat estruturado, enriquecimento profissional assistido e PWA básico.

Ainda não é o software completo do PRD porque o backend multiusuário não existe: não há Supabase/Postgres, RLS, Storage, migrations, permissões reais, convites reais, API REST real, sincronização offline nem persistência segura por usuário. A estratégia correta é manter o protótipo forte para apresentação e fechar os gaps de produto em fila, sem fingir que integrações externas restritas já são produção.

## Matriz PRD x estado atual

| Área do PRD | Estado | Evidência atual | Gap para ficar completo |
| --- | --- | --- | --- |
| Landing/login premium | Feito | Trilha inicial, landing empresários, landing hubs/eventos, fundo animado e cadastro por público. | Refinar continuamente texto/responsivo e reduzir qualquer ruído visual. |
| PWA Android/desktop | Parcial | `manifest.json`, `sw.js`, `offline.html`, meta mobile e service worker em produção. | IndexedDB/cache de dados, sync queue, estado online/offline visível e teste de instalação. |
| Autenticação Google | Parcial forte | GIS/Firebase configurável, escopo People API e importação de contatos quando ambiente está correto. | Backend seguro para tokens, sessão real por usuário, refresh/revogação e fallback controlado. |
| Magic link/email | Faltando | Login por email/senha é local/demonstrativo. | Supabase Auth magic link ou equivalente. |
| Apple login/contatos | Parcial | Apple ID configurável para identidade e importação web por vCard/.ics. | Sign in with Apple real configurado em produção; contatos Apple diretos exigem app nativo/Contacts framework. |
| Dados privados do usuário | Parcial | Contatos ficam no `localStorage` do navegador. | Banco real com isolamento por usuário. |
| Multiusuário | Faltando | Cada navegador tem seu próprio estado local. | Supabase/Postgres + RLS + políticas por escopo. |
| Modelo de contato | Parcial forte | Nome, headline, descrição, tags, emails, telefones, DDD, fonte, links, demanda, resolve, notas, contexto público/grupo e custom fields. | Histórico, múltiplos campos editáveis completos, vínculo real com usuário da plataforma. |
| Importação Google Contacts | Parcial forte | People API no cliente, normalização e importação. | Preview antes de gravar, `import_jobs`, Edge Function, tokens protegidos e confirmação final. |
| Importação CSV/Excel/JSON | Parcial forte | Upload/colar, parser e preview normalizado. | Wizard de mapeamento de colunas, erros por linha e job persistido. |
| Importação manual | Parcial | Form de contato manual. | Incluir links, custom fields e seleção de grupo/fonte no formulário. |
| Dedupe/merge | Parcial | Detecta email/telefone igual e permite mesclar. | Revisão lado a lado, ignorar, marcar revisado e histórico/status da sugestão. |
| Tags | Parcial forte | Tags livres, filtros e nós no grafo. | Autocomplete dedicado e gestão de tags como entidade persistida. |
| Campos personalizados | Parcial | Cria campos em Ajustes e mostra valores importados. | Editar valores por contato, opções para select/multiselect e uso completo nos filtros. |
| Grafo interno | Feito como protótipo | SVG interativo com zoom/pan, filtros, opacidade por foco, nós de contato/tag/fonte/DDD/grupo/demanda/solução. | Trocar para Sigma/Graphology ou Cytoscape para escala, persistir posições e separar motores por contexto. |
| Grafo público/grupos | Parcial | Seleção de grupo no grafo e rede pública local. | Grafo público separado com permissões reais e dados multiusuário. |
| Grupos compartilhados | Parcial | Board de grupos/pastas com cor, tags e adicionar contatos. | Convites reais, papéis reais, remoção, membros ativos e RLS. |
| Rede pública | Parcial | Cards públicos por opt-in local, filtros e vínculo com contato. | Rede real entre usuários, privacidade por campo e matching automático com usuários reais. |
| Chat preparado para IA | Parcial forte | Chat estruturado busca contatos, oportunidades e duplicados. | Histórico persistido, tools AG-UI/CopilotKit e escrita com confirmação/diff. |
| Dashboard | Feito como protótipo | Métricas, onboarding, oportunidades, tags e atalhos. | Dados persistidos e estados vazios/cheios por usuário real. |
| OpenAPI/Swagger | Faltando | Há menção em docs/readme, mas não há rota/tela `/docs`. | Tela/rota de docs com contrato OpenAPI e endpoints planejados. |
| Supabase/Postgres/RLS | Faltando | App local-first. | Migrations, policies, storage e testes de isolamento. |
| UX mobile/desktop | Parcial forte | Sidebar desktop e bottom nav mobile; várias correções de overflow. | Testes contínuos em Android real e acessibilidade mais completa. |
| Light mode | Faltando | Dark mode é o padrão. | Tema claro funcional e persistido. |

## Fila Scrum de entregas

### Entregas fechadas nesta rodada

- Dedupe agora tem fila de revisão, comparação lado a lado, status pendente/revisado, ação de ignorar e merge somente por aprovação explícita.
- OpenAPI/docs ganhou tela navegável em `#/docs`, com endpoints MVP, critérios de produção e preview do contrato OpenAPI.
- PWA/app shell agora mostra status online/offline no topo, deixando claro quando está salvo localmente ou lendo cache.
- Campos personalizados criados em Ajustes agora aparecem no detalhe do contato, com controles por tipo e opções para dropdown/multiselect.
- Hash routes principais foram conectadas ao app: `#/contacts`, `#/import`, `#/graph`, `#/groups`, `#/public-network`, `#/chat`, `#/profile`, `#/settings` e `#/docs`.

### Sprint atual - fechar gaps visíveis do PRD no protótipo

1. **Dedupe completo do MVP** - concluído no protótipo
   - Criar status para sugestões de merge: pendente, revisado e ignorado.
   - Exibir comparação lado a lado dos dois contatos.
   - Permitir mesclar, revisar sem mesclar ou ignorar.
   - Critério de pronto: email/telefone igual gera sugestão, nenhum merge automático acontece e o usuário tem três ações claras.

2. **OpenAPI/docs dentro do app** - concluído como contrato navegável
   - Criar tela/rota de documentação do contrato.
   - Documentar endpoints mínimos do PRD.
   - Critério de pronto: abrir `#/docs` ou botão em Ajustes mostra contrato de API sem depender de backend real.

3. **PWA/offline mais honesto** - parcial concluído
   - Mostrar status online/offline e explicar que dados atuais ficam neste dispositivo.
   - Criar estado visual de reconexão/sincronização futura.
   - Critério de pronto: usuário entende quando está offline e o que foi salvo localmente.

4. **Campos personalizados realmente úteis no contato** - parcial concluído
   - Permitir editar valores de campos customizados na tela de detalhe.
   - Incluir custom fields no cadastro manual.
   - Critério de pronto: campo criado em Ajustes aparece no contato e pode ser preenchido.

5. **Importação com revisão antes de gravar**
   - Melhorar preview CSV/Excel/JSON e Google para etapa explícita de confirmação.
   - Mostrar erros/duplicados antes de importar.
   - Critério de pronto: importação não grava sem o usuário ver o preview.

### Sprint seguinte - virar produto real

6. **Supabase Auth + Postgres + RLS**
   - Login real, magic link, perfil, contatos privados por usuário e políticas de isolamento.

7. **Import jobs e Google via backend**
   - Edge Function para People API, tokens seguros, jobs persistidos e relatório de importação.

8. **Grupos compartilhados reais**
   - Convites, papéis, membros ativos/removidos e dados de grupo isolados.

9. **Grafo escalável**
   - Adapter para Sigma.js/Graphology, clustering, persistência de posição e subgrafos.

10. **IA/copiloto com tools**
   - Estado legível, ferramentas de leitura e escrita com confirmação.

## Riscos e decisões

- LinkedIn não deve ser scraping logado. O protótipo pode abrir pesquisa pública e registrar evidências revisadas; integração real depende de API/permissões oficiais.
- Apple Contacts direto no navegador não é equivalente ao Contacts framework nativo. No web, o caminho honesto é Apple ID para identidade e vCard/.ics para dados.
- Google People API no cliente serve para protótipo validável, mas produção deve mover token/importação para backend/Edge Function.
- O app deve continuar separando dados reais importados de dados de demonstração para não parecer artificial quando o usuário conecta Google ou arquivo próprio.
