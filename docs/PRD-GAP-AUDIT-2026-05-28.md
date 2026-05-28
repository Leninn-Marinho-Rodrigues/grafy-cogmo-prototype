# Grafy PRD gap audit - 2026-05-28

Este arquivo registra o que foi atacado nesta rodada e o que ainda falta para o PRD virar produto completo.

## Melhorado nesta rodada

- Landing/login deixou de ser uma tela estatica e passou a ter canvas animado de rede, spotlight por ponteiro, preview de produto e transicoes com `motion`.
- Dashboard ganhou faixa de onboarding, mini-grafo vivo e numeros baseados em uma base demo mais rica.
- Grafo interno ganhou camada animada de particulas/conexoes atras do SVG, mantendo filtros, zoom e clique em nos.
- Base demo saiu de 8 para 12 contatos, com contextos mais realistas de eventos, SaaS, PMEs, seguranca, construcao e comunidades.
- Navegacao mobile preserva as principais rotas do MVP.

## Lacunas criticas do PRD ainda nao concluídas

- Auth real com Supabase Auth, Google login e magic link.
- Google Contacts real via OAuth + People API + backend seguro.
- Onboarding persistido em etapas, nao apenas faixa de progresso visual.
- Banco Postgres/Supabase, migrations, RLS e Storage.
- CRUD completo com persistencia multiusuario.
- Campos customizados ainda sao demonstrativos e nao filtram tudo que o PRD pede.
- Grafo ainda usa SVG gerado no front; para escala real deve evoluir para Sigma.js/Graphology ou Cytoscape.
- Rede publica ainda e demo local, sem permissao multiusuario real.
- Grupos compartilhados ainda nao têm convite, papeis reais, RLS e admin completo.
- Chat ainda e busca estruturada local, sem CopilotKit/AG-UI nem tools confirmadas.
- OpenAPI/Swagger ainda e documentacao planejada, nao endpoint real.
- PWA existe, mas offline/sync precisa validacao e estrategia de conflito.

## Proxima prioridade recomendada

1. Consolidar UX visual das telas principais com componentes menores.
2. Ligar Supabase Auth e criar schema minimo com RLS.
3. Trocar persistencia local por Supabase para contatos, tags e campos customizados.
4. Implementar importacao CSV completa com jobs e preview persistido.
5. Implementar Google Contacts via Edge Function.
6. Trocar grafo SVG por motor dedicado quando a base passar de algumas centenas de nos.
