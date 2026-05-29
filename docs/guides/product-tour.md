# Tour do Produto

Este guia resume como apresentar o Grafy para uma pessoa que está vendo o projeto pela primeira vez.

Demo animado:

![Fluxo demonstrativo do Grafy](../assets/grafy-demo-flow.gif)

Versão em vídeo curto: [grafy-demo-flow.mp4](../assets/grafy-demo-flow.mp4)

## 1. Landing e entrada

![Landing do Grafy](../assets/grafy-01-landing.png)

A entrada mostra a proposta central: transformar contatos em um mapa vivo de networking. O visual usa fundo animado, partículas conectadas e uma área de login demonstrativa.

Pontos para comentar:

- O produto nasce como PWA-first.
- A experiência foi pensada para desktop e Android.
- O login real com Google/Supabase está planejado para a próxima fase.
- O modo atual permite testar sem conta real.

## 2. Dashboard

![Dashboard do Grafy](../assets/grafy-02-dashboard.png)

O dashboard resume a rede do usuário e dá atalhos para ações importantes.

O que observar:

- Total de contatos.
- Tags mais usadas.
- Duplicados sugeridos.
- Demandas e oportunidades recentes.
- Acesso rápido a importação, grafo e chat.

## 3. Grafo de networking

![Grafo do Grafy](../assets/grafy-03-grafo.png)

O grafo é a principal camada visual do produto. Ele mostra contatos, tags, DDDs, fontes, grupos e possíveis matches.

Interações atuais:

- Arrastar para navegar.
- Usar roda do mouse para zoom dentro do canvas.
- Clicar em nós para abrir o inspetor.
- Filtrar por tags, fonte, grupo, DDD, demanda, problema resolvido e tipo.
- Manter a rolagem da página normal fora da área do grafo.

## 4. Rede pública

![Rede pública do Grafy](../assets/grafy-04-rede-publica.png)

A Rede mostra apenas perfis com opt-in. Ela existe para descoberta sem expor a base privada do usuário.

O que explicar:

- Email e telefone não aparecem nos cards públicos.
- Perfis públicos podem ser reconhecidos quando também existem como contatos internos.
- Os cards usam tags, demanda e problema que resolve para ajudar a busca e o grafo.

## 5. Chat

![Chat do Grafy](../assets/grafy-05-chat.png)

O chat simula um copiloto de networking. No MVP atual, ele faz busca estruturada em dados locais.

Exemplos de perguntas:

- "Quem presta serviço de limpeza?"
- "Quem está em DDD 11?"
- "Quem busca parceria?"
- "Quais contatos parecem duplicados?"

## 6. Perfil e visibilidade

![Perfil do Grafy](../assets/grafy-06-perfil.png)

O perfil concentra informações que viram sinais úteis para rede, busca e grafo.

Campos importantes:

- Nome, headline e descrição.
- Tags estratégicas.
- Problema que resolve.
- Demanda atual.
- Links externos.
- Controle de visibilidade pública.

## 7. Mobile

![Versão mobile do Grafy](../assets/grafy-07-mobile.png)

O layout é responsivo e preparado para evolução como PWA instalável.

O que ainda deve evoluir:

- Polimento fino de navegação mobile.
- Push notifications.
- Sincronização offline/online com backend real.
- Cache inteligente por usuário autenticado.
