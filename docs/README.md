# Documentação do Grafy

Esta pasta organiza materiais de produto, arquitetura, pesquisa e validação do protótipo.

Atualização desta fase: o protótipo passou a ter duas páginas de landing por rota hash: `#/empresarios` para o usuário B2C e `#/hubs-eventos` para hubs/eventos/empresas. O onboarding agora começa pelos conectores: Google Contacts + Google Agenda quando há `VITE_GOOGLE_CLIENT_ID`, Apple Contacts por vCard, Apple Agenda por `.ics`, DDD/localidade e preview antes de gravar contatos.

## Guias principais

- [Tour do produto](guides/product-tour.md)
- [Arquitetura e decisões técnicas](guides/architecture.md)
- [Roteiro de demo](guides/demo-script.md)
- [Design system e UX](guides/design-system.md)
- [Checklist de execucao das ultimas solicitacoes](guides/execution-checklist-last-requests.md)

## Pesquisa e auditoria

- [Pesquisa de referências de apps de networking/CRM](RESEARCH-NETWORK-CRM-INSPIRATION-2026-05-28.md)
- [Pesquisa profunda de apps, integrações e bibliotecas](DEEP-RESEARCH-NETWORK-APPS-2026-05-28.md)
- [Auditoria de gaps do PRD](PRD-GAP-AUDIT-2026-05-28.md)
- [QA funcional do PRD](PRD-FUNCTIONAL-QA-2026-05-28.md)

## Assets

Os arquivos em [assets](assets/) são usados no README e nos guias:

- `grafy-demo-flow.gif`
- `grafy-demo-flow.mp4`
- `grafy-01-landing.png`
- `grafy-02-dashboard.png`
- `grafy-03-grafo.png`
- `grafy-04-rede-publica.png`
- `grafy-05-chat.png`
- `grafy-06-perfil.png`
- `grafy-07-mobile.png`
- `grafy-08-import-google-apple.png`
- `grafy-09-landing-hub.png`

## Observação

Esta documentação é propositalmente objetiva: suficiente para entender e apresentar o protótipo, sem expor detalhes internos sensíveis de negócio.
