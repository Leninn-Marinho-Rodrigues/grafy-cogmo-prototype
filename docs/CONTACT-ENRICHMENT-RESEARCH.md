# Grafy - pesquisa de enriquecimento profissional de contatos

Este documento resume como o Grafy deve transformar nome, telefone, email, DDD e origem dos contatos em sugestões profissionais úteis, sem inventar dados e sem scraping logado.

## Decisão de produto

O Grafy deve enriquecer contatos em três camadas:

1. Dados autorizados pelo usuário: Google People API, Google Calendar, Apple vCard/.ics, Excel/CSV/JSON do hub.
2. Inteligência local: normalização de telefone, DDD, domínio de email, cargo, empresa, área, tags, fuzzy match e deduplicação.
3. Provedores externos: APIs de enriquecimento, busca pública e validação de telefone, sempre com evidência, confiança e aprovação humana antes de gravar.

O LinkedIn oficial não deve ser tratado como "buscar qualquer pessoa por telefone". A rota segura é usar APIs oficiais quando houver aprovação, abrir busca pública assistida ou usar provedores de enriquecimento com contrato, chave e conformidade.

## APIs avaliadas

| API | Melhor uso no Grafy | Limite importante |
| --- | --- | --- |
| Google People API | Importar contatos autorizados do próprio usuário com nome, email, telefone, foto e organização. | Só retorna dados autorizados e existentes na conta do usuário. |
| LinkedIn oficial | Login/vínculo de identidade e recursos aprovados no catálogo do LinkedIn. | Não é lookup aberto por telefone/nome para qualquer contato. |
| People Data Labs | Enriquecimento por email, nome, empresa, domínio e sinais profissionais. | Depende de chave, plano e revisão LGPD. |
| Proxycurl / Nubela | Consulta de perfis públicos profissionais por URL ou sinais permitidos. | Validar termos, custo e disponibilidade antes de produção. |
| Hunter | Validação e enriquecimento de email/domínio corporativo. | Forte para B2B por email/domínio, fraco para telefone puro. |
| Pipl Search API | Resolução de identidade com nome, email, telefone e sinais públicos. | Sensível; exige finalidade clara, auditoria e consentimento. |
| AbstractAPI / Numverify | Validação de telefone, país, operadora e tipo do número. | Não descobre LinkedIn; melhora confiança regional. |
| Brave/Bing/Google CSE/SerpAPI | Busca pública por nome + empresa + cargo + LinkedIn. | Deve respeitar quotas, termos e exibir evidência para revisão. |

## Bibliotecas instaladas/preparadas

| Biblioteca | Uso |
| --- | --- |
| `libphonenumber-js` | Normalizar e validar telefones, ajudando DDD/região e E.164. |
| `fuse.js` | Fuzzy search entre contatos, cargos, empresas, emails e tags. |
| `tldts` | Extrair domínio corporativo de email e sugerir empresa. |
| `fastest-levenshtein` | Pontuar similaridade entre nome do contato e email/resultado externo. |
| `zod` | Validar respostas de provedores antes de transformar em sugestão. |
| `openai`/embeddings futura | Similaridade semântica entre demandas, soluções, áreas e descrições. |

## Fluxo funcional implementado no protótipo

1. O usuário importa contatos reais por Google Contacts, Apple vCard/.ics, CSV, Excel ou JSON.
2. O Grafy lê nome, telefone, email, DDD, empresa, cargo, área e LinkedIn já salvo.
3. O motor gera sugestões de enriquecimento com provedor indicado, confiança, evidências e tags.
4. O usuário pode abrir a evidência pública em uma nova aba.
5. O usuário pode aplicar sinais revisados ao contato: cargo, empresa, tags, nota de evidência e link LinkedIn quando a URL já for um perfil real.

## Próxima fase de backend

Para produção, mover chamadas externas para backend/Edge Functions:

- guardar chaves fora do front-end;
- registrar consentimento e finalidade;
- cachear respostas por contato/provedor;
- criar fila de `enrichment_jobs`;
- gravar `enrichment_suggestions` com status `pending`, `approved`, `ignored` ou `expired`;
- auditar qual usuário aprovou cada alteração.

