# Checklist de Execucao - Ultimas Solicitacoes do Grafy

Este documento existe para impedir que o trabalho seja retomado de forma incompleta. Ele resume as ultimas solicitacoes da conversa, separa o que ja foi concluido do que ficou parcial e define uma ordem de execucao para o proximo ciclo de Codex.

Regra principal: nao encerrar a conversa enquanto houver checklist obrigatorio pendente, salvo bloqueio real documentado com evidencia.

## Como usar

1. Comece por `git status --short`.
2. Nao inclua arquivos soltos antigos sem revisar. No ultimo estado conhecido, `package.json` e `docs/resumos-whatsapp/` apareciam fora do commit da documentacao.
3. Leia este documento inteiro.
4. Execute os blocos na ordem.
5. Depois de cada bloco, rode a validacao indicada.
6. Atualize este arquivo marcando o status.
7. Ao final, rode build, QA visual, screenshots e deploy.

## Ultimas solicitacoes auditadas

| Pedido | Status | Evidencia/observacao |
| --- | --- | --- |
| Fazer deploy publico para chefe/colegas testarem | Concluido | GitHub Pages publicado em `https://leninn-marinho-rodrigues.github.io/grafy-cogmo-prototype/`. |
| Auditar PRD/PCD e verificar funcoes sugeridas | Concluido como documento | Ver `docs/PRD-FUNCTIONAL-QA-2026-05-28.md`. |
| Grande pacote de UX, ortografia, grafo neural, filtros, pastas, tags, grupos, Rede, Chat, Perfil, Ajustes e integracoes | Parcial | Varias partes foram melhoradas, mas o pacote completo ainda precisa de execucao sistematica. Ver Blocos 1 a 9. |
| Corrigir scroll da pagina quando usa roda do mouse dentro do grafo | Concluido | Roda do mouse agora controla zoom no grafo e nao rola a pagina dentro do canvas. |
| Corrigir selo/titulo da Rede publica muito perto e desalinhado | Concluido | Hero da Rede recebeu espacamento e alinhamento. |
| Corrigir tags tortas nos cards da Rede | Concluido | Chips centralizados e com altura consistente. |
| Corrigir bolinha do toggle de visibilidade | Concluido | Centro vertical validado com `centerDelta: 0`. |
| Melhorar estrutura do GitHub com README, docs, imagens, GIF e video | Concluido | README, `docs/guides`, assets, templates de issue/PR, GIF e MP4 adicionados. |
| Continuar o que foi interrompido | Em andamento | Este arquivo e o roteiro de retomada. |

## Imagens de referencia

### Imagens ja salvas no repositorio

- `docs/assets/grafy-01-landing.png`
- `docs/assets/grafy-02-dashboard.png`
- `docs/assets/grafy-03-grafo.png`
- `docs/assets/grafy-04-rede-publica.png`
- `docs/assets/grafy-05-chat.png`
- `docs/assets/grafy-06-perfil.png`
- `docs/assets/grafy-07-mobile.png`
- `docs/assets/grafy-demo-flow.gif`
- `docs/assets/grafy-demo-flow.mp4`

### Imagens anexadas na conversa

Estas imagens foram anexadas no chat e devem ser usadas visualmente quando o ambiente da conversa as disponibilizar:

1. **Rede - selo perto do titulo:** mostra o selo "DESCOBERTA COM OPT-IN" muito proximo de "Rede publica".
2. **Rede - tags tortas nos cards:** mostra tags dos cards publicos desalinhadas e com distribuicao irregular.
3. **Perfil - toggle desligado:** mostra a bolinha do toggle baixa demais dentro da barra.
4. **Perfil - toggle ligado:** mostra a bolinha verde baixa demais dentro da barra.

Essas quatro correcoes pontuais ja foram executadas, mas devem continuar como referencia para nao regredir.

## Bloco 0 - Preparacao obrigatoria

### Objetivo

Entrar no projeto sem destruir trabalho existente e confirmar o estado atual.

### Comandos

```bash
git status --short
npm install
npm run build
npm run preview -- --port 4176
```

### Checklist

- [ ] Confirmar branch atual.
- [ ] Listar arquivos modificados/untracked.
- [ ] Identificar alteracoes do usuario que nao devem ser revertidas.
- [ ] Abrir `http://127.0.0.1:4176/`.
- [ ] Confirmar que a landing carrega.
- [ ] Entrar no modo demonstrativo.
- [ ] Conferir console sem erros relevantes.

## Bloco 1 - Auditoria completa de texto e ortografia

### Contexto do pedido

O usuario pediu melhorar toda a ortografia do aplicativo, incluindo acentos, virgulas e textos que parecem superficiais.

### Script de execucao

1. Procurar textos quebrados ou sem acento em `src/App.tsx`, `src/data.ts`, `src/lib.ts`, `src/styles.css`, `README.md` e `docs/`.
2. Procurar sinais de mojibake ou caracteres quebrados:

```bash
rg -n "Ã|Â|â|nao|voce|publica|prototipo|servico|gestao|inovacao|conexao|estrategia|operacao|financeiro" src docs README.md
```

3. Corrigir os textos visiveis do app em portugues do Brasil.
4. Manter linguagem moderna, clara e orientada a networking.
5. Evitar promessas falsas de integracao real.
6. Rodar build.
7. Validar no navegador as telas principais.

### Arquivos provaveis

- `src/App.tsx`
- `src/data.ts`
- `src/lib.ts`
- `README.md`
- `docs/guides/*.md`

### Aceite

- [ ] Nenhum texto visivel com acento faltando quando deveria haver.
- [ ] Nenhum texto visivel com mojibake.
- [ ] Landing, Dashboard, Grafo, Rede, Chat, Perfil e Ajustes revisados.
- [ ] `npm run build` passou.
- [ ] Screenshots atualizados se o texto mudar muito.

## Bloco 2 - UX/UI geral do app inteiro

### Contexto do pedido

O usuario pediu que o site todo ficasse mais moderno, vivo, profissional, menos estatico e com melhor distribuicao de informacoes, seguindo a ideia do `grafyy.lovable.app`.

### Script de execucao

1. Fazer walkthrough completo do app:
   - Landing
   - Dashboard
   - Contatos
   - Importar
   - Conectores
   - Grafo
   - Grupos
   - Rede
   - Chat
   - Perfil
   - Ajustes
2. Para cada tela, registrar:
   - O que parece apertado.
   - O que parece artificial.
   - O que esta sem hierarquia visual.
   - O que esta sem feedback de interacao.
3. Ajustar espacamentos, densidade, alinhamento, estados hover/focus e microcopy.
4. Nao criar landing generica; preservar app funcional como destino principal.
5. Validar desktop e mobile.

### Aceite

- [ ] Todas as telas principais revisadas visualmente.
- [ ] Nenhum texto importante colado em outro elemento.
- [ ] Nenhum chip/botao desalinhado.
- [ ] Mobile sem overflow horizontal.
- [ ] Console sem erros.
- [ ] Screenshots atualizados em `docs/assets/`.

## Bloco 3 - Fundo neural e movimento com mouse

### Contexto do pedido

O usuario quer um fundo como rede neural que conecta perto do mouse e desconecta ao sair do ponto de origem, com sensacao de vida e interacao.

### Script de execucao

1. Revisar o componente/codigo do fundo animado.
2. Garantir que:
   - Particulas reagem ao mouse.
   - Linhas aparecem perto do cursor.
   - Linhas somem suavemente quando o cursor se afasta.
   - O efeito nao atrapalha leitura.
   - `prefers-reduced-motion` e respeitado.
3. Aplicar o efeito nas areas certas:
   - Landing.
   - Background global do app.
   - Grafo sem competir com os nos.
4. Validar performance.

### Aceite

- [ ] Mouse influencia conexoes do fundo.
- [ ] As conexoes se desfazem suavemente.
- [ ] Efeito nao cobre texto nem controles.
- [ ] Funciona em desktop.
- [ ] Mobile nao fica pesado.

## Bloco 4 - Grafo neural, filtros, pastas e taxonomia

### Contexto do pedido

O usuario quer que o grafo pareca uma rede neural de contatos, com zoom/pan, filtros combinaveis e conexoes por area, cargo, DDD, empresa, tipo de negocio, diretor/decisor etc.

### Script de execucao

1. Auditar o modelo atual do grafo.
2. Criar/ampliar taxonomia inicial:
   - Areas: marketing, vendas, financeiro, tecnologia, operacoes, juridico, RH, produto.
   - Cargos: CEO, CFO, CTO, diretor, gerente, fundador, especialista, decisor.
   - Empresas/tipo: PME, startup, consultoria, comunidade, evento, SaaS, servicos.
   - Localidade/DDD.
   - Demandas.
   - Problemas que resolve.
3. Criar conceito de **pastas** ou colecoes:
   - Contatos podem pertencer a uma pasta.
   - Pessoas da mesma pasta ganham conexao extra.
   - Pasta aparece como filtro e no grafo.
4. Filtros devem ser cumulativos:
   - Exemplo: `diretor` + `financas` mostra diretores de financas.
   - Fora do filtro: opcao A, ocultar; opcao B, reduzir para 8% de opacidade.
5. Melhorar legenda e cores.
6. Garantir zoom/pan sem scroll da pagina dentro do canvas.

### Aceite

- [ ] Filtros combinaveis funcionam.
- [ ] Opacidade de contatos fora do filtro fica proxima de 8% ou eles somem, conforme decisao registrada.
- [ ] Tags de area/cargo/DDD/empresa/tipo sao compreensiveis.
- [ ] Pastas existem visualmente e afetam conexoes.
- [ ] Grafo continua com pan e zoom.
- [ ] Screenshot novo do grafo salvo em `docs/assets/grafy-03-grafo.png`.

## Bloco 5 - Tags e organizacao visual

### Contexto do pedido

O usuario disse que tags como Google Contacts, LinkedIn etc. davam impressao de bagunca e pediu tags mais faceis de entender.

### Script de execucao

1. Revisar chips globais:
   - filtros
   - cards de contato
   - rede publica
   - grupos
   - conectores
2. Separar visualmente tipos de tag:
   - area
   - cargo
   - fonte
   - status
   - demanda
   - pasta
3. Usar cores com significado e sem poluicao.
4. Garantir texto centralizado e sem quebra feia.
5. Criar sugestoes iniciais de tags para guiar usuario.

### Aceite

- [ ] Tags nao parecem jogadas.
- [ ] Tipos de tag sao distinguiveis.
- [ ] Cards da Rede continuam alinhados.
- [ ] Filtros continuam clicaveis e claros.

## Bloco 6 - Grupos como board/Kanban

### Contexto do pedido

O usuario pediu grupos mais faceis de entender, com estilo de Kanban, cores diferentes e tags por grupo.

### Script de execucao

1. Revisar aba **Grupos**.
2. Transformar grupos em colunas/cards mais parecidos com board:
   - Nome do grupo.
   - Cor do grupo.
   - Tags do grupo.
   - Contatos associados.
   - Acoes rapidas.
3. Permitir edicao clara de cor e tags.
4. Mostrar como grupo afeta o grafo.
5. Validar mobile.

### Aceite

- [ ] Grupos parecem board visual, nao lista solta.
- [ ] Cores e tags de grupos aparecem.
- [ ] UX deixa claro como grupo se conecta ao grafo.

## Bloco 7 - Rede publica mais clara e dinamica

### Contexto do pedido

O usuario disse que a aba Rede estava nebulosa e pediu explicar melhor o que e Rede, como usar e como ela se integra ao resto do sistema.

### Script de execucao

1. Revisar hero da Rede.
2. Adicionar explicacao curta sem poluir:
   - Rede e opt-in.
   - Nao expoe contatos privados.
   - Ajuda descoberta e complementaridade.
3. Melhorar filtros por tags/demandas/problemas.
4. Mostrar relacao com grafo e perfil.
5. Garantir cards publicos bem alinhados.

### Aceite

- [ ] Rede fica autoexplicativa.
- [ ] Privacidade fica clara.
- [ ] O usuario entende por que usar a Rede.
- [ ] Screenshot novo salvo em `docs/assets/grafy-04-rede-publica.png`.

## Bloco 8 - Chat com respostas mais ricas

### Contexto do pedido

O usuario pediu que o chat mostre mais informacoes antes do clique no contato.

### Script de execucao

1. Revisar cards de resultado do chat.
2. Mostrar pelo menos:
   - Nome.
   - Headline/cargo.
   - Tags principais.
   - Problema que resolve.
   - Demanda atual.
   - DDD/fonte quando relevante.
   - Motivo pelo qual apareceu.
3. Adicionar destaque do match.
4. Manter card compacto.
5. Validar perguntas:
   - "quem presta servico de limpeza?"
   - "quem e diretor de financas?"
   - "quem busca parceria?"

### Aceite

- [ ] Resultado do chat tem contexto suficiente antes do clique.
- [ ] O motivo do match fica claro.
- [ ] Nao ha cards gigantes ou confusos.

## Bloco 9 - Perfil, Ajustes e integracoes seguras

### Contexto do pedido

O usuario pediu Perfil e Ajustes mais uteis, com integracoes LinkedIn, email, Instagram, Twitter/X e contatos salvos, para criar rede neural de oportunidades.

### Limite importante

Nao prometer nem implementar scraping logado de redes sociais. Usar somente:

- APIs oficiais.
- OAuth autorizado.
- Importacao manual/CSV/export oficial.
- Pesquisa assistida com revisao humana.
- Preview antes de salvar.

### Script de execucao

1. Revisar Perfil:
   - Mostrar como cada campo ajuda o sistema.
   - Deixar links sociais claros.
   - Deixar visibilidade publica util e segura.
2. Revisar Ajustes:
   - Criar secoes de conectores:
     - Google Contacts
     - LinkedIn oficial/assistido
     - Meetup
     - Instagram/Twitter/X como futuro/placeholder seguro
     - CSV/importacao manual
   - Mostrar status: conectado, pendente, em breve.
   - Explicar dados que seriam importados.
3. Criar arquitetura documentada para tokens e consentimento.
4. Nao coletar dados reais sem backend seguro.

### Aceite

- [ ] Perfil deixa claro por que as informacoes sao valiosas.
- [ ] Ajustes parecem potentes, nao superficiais.
- [ ] Conectores nao prometem algo falso.
- [ ] Privacidade e consentimento aparecem com clareza.

## Bloco 10 - GitHub e documentacao apos novas mudancas

### Contexto do pedido

O usuario quer o GitHub bonito e bem explicado com GIFs, videos, imagens, arquitetura e passos.

### Script de execucao

Sempre que mudar UI relevante:

1. Atualizar screenshots em `docs/assets/`.
2. Atualizar GIF/MP4 se o fluxo principal mudar muito.
3. Atualizar README se a promessa do produto mudar.
4. Atualizar `docs/guides/product-tour.md`.
5. Atualizar `docs/guides/architecture.md` se mudar modelo/fluxo.
6. Rodar:

```bash
npm run build
git diff --check
```

7. Commitar com mensagem clara.
8. Push.
9. Acompanhar GitHub Actions.
10. Validar link publico.

### Aceite

- [ ] README renderiza com imagens.
- [ ] Links internos funcionam.
- [ ] GitHub repo description/homepage/topics continuam corretos.
- [ ] Deploy passou.

## Prompt de retomada para o Codex

Use este prompt quando quiser retomar o trabalho sem perder contexto:

```text
Leia docs/guides/execution-checklist-last-requests.md inteiro.
Execute os blocos pendentes em ordem.
Nao finalize a conversa enquanto houver checkbox obrigatorio pendente, salvo bloqueio real documentado.
Preserve alteracoes do usuario.
Nao inclua package.json nem docs/resumos-whatsapp sem revisar e justificar.
Depois de cada bloco, rode build quando houver mudanca de codigo, valide no navegador e atualize screenshots se a UI mudou.
Ao final, faça commit, push, acompanhe GitHub Actions e confirme o link publico.
```

## Status atual dos blocos

- [ ] Bloco 0 - Preparacao obrigatoria
- [ ] Bloco 1 - Auditoria completa de texto e ortografia
- [ ] Bloco 2 - UX/UI geral do app inteiro
- [ ] Bloco 3 - Fundo neural e movimento com mouse
- [ ] Bloco 4 - Grafo neural, filtros, pastas e taxonomia
- [ ] Bloco 5 - Tags e organizacao visual
- [ ] Bloco 6 - Grupos como board/Kanban
- [ ] Bloco 7 - Rede publica mais clara e dinamica
- [ ] Bloco 8 - Chat com respostas mais ricas
- [ ] Bloco 9 - Perfil, Ajustes e integracoes seguras
- [ ] Bloco 10 - GitHub e documentacao apos novas mudancas

