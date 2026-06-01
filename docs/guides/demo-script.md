# Roteiro de Demo

Este roteiro foi pensado para uma apresentação rápida do protótipo para colegas, liderança ou pessoas que ainda não conhecem o Grafy.

## Link

```text
https://leninn-marinho-rodrigues.github.io/grafy-cogmo-prototype/
```

## Antes de começar

Explique em uma frase:

> O Grafy transforma contatos salvos em uma rede visual de oportunidades, mostrando quem resolve o quê, quem busca o quê e quais conexões podem gerar valor.

Avisos importantes:

- É um protótipo funcional.
- O login atual ainda é local no protótipo, mas a entrada principal exige conectar/importar dados reais.
- Os dados ficam no navegador da pessoa.
- Supabase persistente, Apple nativo, LinkedIn e Meetup entram na próxima fase.

## Demo de 5 minutos

### 1. Landing

Mostre a tela inicial e comente:

- Visual premium e PWA-first.
- Fundo de rede interativo.
- Produto orientado a networking, não a uma profissão específica.
- Três entradas: `#/` pergunta o tipo de negócio, `#/empresarios` abre B2C e `#/hubs-eventos` abre B2B/B2B2C.
- B2C: rede privada do empresário para clientes, parceiros e fornecedores.
- B2B/B2B2C: base compartilhada para eventos, hubs, comunidades e empresas.

### 2. Onboarding com conectores

Mostre o primeiro card e escolha um caminho:

- **Entrar com Google e importar contatos reais:** tenta OAuth real quando `VITE_GOOGLE_CLIENT_ID` existe; sem credencial, mostra a pendência sem injetar amostras.
- **Vincular Apple ID + Apple .vcf/.ics:** Apple ID resolve identidade; contatos e agenda entram por arquivos exportados no web.
- **Hub/evento/empresa:** carrega Excel, CSV ou JSON com participantes antes de abrir o workspace.

Comente que cada pessoa pode testar sem criar conta real e que autenticação persistente entra com Supabase Auth.

Abra **Importar** e demonstre:

- **Google Data Hub:** repete o conector para Contacts, com Agenda opcional, e deixa claro quando falta Client ID.
- **Apple Contacts + Calendar:** importa `.vcf` do iCloud/Contatos ou `.ics` da Apple Agenda.
- **Excel/CSV/JSON:** caminho principal para bases corporativas, hubs e eventos.

### 3. Dashboard

Mostre:

- Total de contatos.
- Tags mais usadas.
- Duplicados sugeridos.
- Oportunidades e demandas.

Frase útil:

> A ideia é o usuário chegar e entender a própria rede antes de procurar contato por contato.

### 4. Grafo

Abra **Grafo**.

Demonstre:

- Zoom com roda do mouse dentro do grafo.
- Arrastar o canvas.
- Filtros por tag, fonte, grupo, DDD e tipo.
- Clique em nós para abrir contexto.

Frase útil:

> O grafo não é para editar relações manualmente; ele é uma camada de leitura para entender padrões e planejar introduções.

### 5. Rede pública

Abra **Rede**.

Mostre:

- Cards públicos com opt-in.
- Tags centralizadas e filtros.
- Privacidade: email e telefone ficam fora dos cards públicos.

Frase útil:

> A rede pública é uma camada de descoberta; ela não expõe a agenda privada do usuário.

### 6. Chat

Abra **Chat** e use exemplos como:

```text
quem presta serviço de limpeza?
```

ou:

```text
quem está buscando parceria?
```

Explique:

- Hoje é busca estruturada local.
- Amanhã vira copiloto com IA e confirmação para edição de dados.

### 7. Perfil

Abra **Perfil**.

Mostre:

- Tags estratégicas.
- Problema que resolve.
- Demanda atual.
- Links externos.
- Controle **Quero ser visto na minha rede**.

Frase útil:

> O perfil público vira ouro para a rede: ele ajuda outras pessoas e o próprio sistema a entender onde existe oportunidade.

## Como limpar dados de teste

Na aba **Ajustes**, use **Apagar conta de teste**. Isso limpa o workspace salvo no navegador da pessoa.

## Perguntas comuns

### Já puxa contatos reais do Google?

Sim, se o deploy for gerado com `VITE_GOOGLE_CLIENT_ID` válido e origem autorizada no Google Cloud. Sem essa variável, o protótipo mostra a configuração pendente e não injeta contatos artificiais. Em produção, o ideal é mover tokens para backend/Edge Function.

### Já puxa Apple Contacts?

No protótipo web, sim por arquivo vCard/.vcf ou texto colado. Apple Agenda também entra por `.ics`. A coleta nativa direta de Apple Contacts e Apple Calendar exige app nativo/wrapper com Contacts framework e EventKit.

### Dá para puxar LinkedIn?

O caminho correto é usar APIs oficiais aprovadas e pesquisa assistida com revisão humana. O produto não deve depender de scraping logado.

### Os dados ficam compartilhados?

Nesta versão, não. O protótipo salva no navegador. A próxima fase usa Supabase/Postgres com separação por usuário, grupos e perfis públicos.

### O grafo escala para muitos contatos?

O grafo atual demonstra a experiência. Para bases grandes, a recomendação é evoluir para Sigma.js/Graphology ou engine equivalente.
