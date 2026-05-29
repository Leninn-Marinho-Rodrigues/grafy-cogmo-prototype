# Design System e UX

Este guia registra a direção visual atual do Grafy para manter consistência nas próximas evoluções.

## Direção visual

O Grafy usa uma estética premium, escura, moderna e levemente futurista. A interface deve parecer uma ferramenta de trabalho sofisticada, não uma landing genérica.

Princípios:

- Legibilidade acima de efeito visual.
- Movimento suave para comunicar rede viva.
- Cards compactos, sem excesso de decoração.
- Grafo como elemento memorável do produto.
- Separação clara entre base privada, grupos e rede pública.

## Paleta

| Token | Uso |
| --- | --- |
| `--bg`, `--bg-2` | Fundo principal e camadas profundas. |
| `--surface`, `--surface-strong` | Painéis, cards e áreas de trabalho. |
| `--line` | Bordas e divisões discretas. |
| `--text` | Texto principal. |
| `--muted`, `--soft` | Texto secundário. |
| `--cyan` | Ações, grafo e foco visual. |
| `--green` | Estados positivos e privacidade ativa. |
| `--amber` | Rede pública e opt-in. |
| `--violet` | Tags e nós estruturais. |
| `--coral` | Alertas, duplicados e atenção. |

## Componentes

### Botões

- Botões primários devem indicar próxima ação clara.
- Botões secundários servem para navegação, detalhes e ações menos críticas.
- Ícones devem ajudar a leitura, não competir com o texto.

### Cards

- Cards devem ter raio pequeno e aparência profissional.
- Evitar cards dentro de cards.
- Informações repetidas devem manter mesma anatomia visual.

### Tags

- Tags em cards públicos usam altura fixa, texto centralizado e distribuição equilibrada.
- Tags em listas podem ser mais compactas.
- Tags são entidades fortes do produto e também nós do grafo.

### Grafo

- O canvas deve bloquear scroll da página apenas quando o mouse está dentro dele.
- A roda do mouse controla zoom no grafo.
- Fora do grafo, a página volta a rolar normalmente.
- Nós devem ter labels legíveis e cores com significado.

### Toggle

- A bolinha deve deslizar centralizada verticalmente.
- Estados ligados devem usar verde; desligados, cinza.
- O componente deve parecer parte do painel, não um controle solto.

## Motion

Movimentos atuais:

- Fundo animado de rede.
- Fluxo nas arestas do grafo.
- Hover suave em botões e cards.
- Transições curtas, sem exagero.

Regras:

- Movimento deve orientar atenção.
- Evitar animação que atrapalhe leitura.
- Respeitar `prefers-reduced-motion`.

## Responsividade

Desktop:

- Sidebar fixa.
- Área principal com painéis amplos.
- Grafo com inspetor lateral.

Mobile:

- Bottom navigation.
- Conteúdo em coluna.
- Cards empilhados.
- PWA preparado para tela cheia.

## Próximos refinamentos visuais

- Melhorar empty states.
- Criar estados de loading e sincronização.
- Evoluir gráficos e filtros para bases maiores.
- Criar tema claro completo.
- Documentar componentes reutilizáveis caso o app seja separado em design system formal.
