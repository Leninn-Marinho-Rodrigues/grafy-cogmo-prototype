# Ativar login Google real e importar contatos

Este guia deixa o Grafy pronto para o fluxo esperado no protótipo público:

1. usuário clica em **Continuar com Google**;
2. Google abre a tela oficial de consentimento;
3. o Grafy recebe o perfil autorizado;
4. o Grafy lê Google Contacts via People API;
5. os contatos entram no workspace, com DDD, tags, fontes e deduplicação inicial.

## 1. Criar OAuth Client no Google Cloud

No Google Cloud Console, crie ou selecione um projeto.

Depois:

1. Vá em **APIs & Services > Library**.
2. Habilite **People API**.
3. Opcional: habilite **Google Calendar API** apenas se quiser importar participantes da Agenda.
4. Vá em **APIs & Services > OAuth consent screen**.
5. Configure o app externo ou interno.
6. Adicione o escopo `https://www.googleapis.com/auth/contacts.readonly`.
7. Opcional: adicione `https://www.googleapis.com/auth/calendar.readonly`.
8. Vá em **APIs & Services > Credentials**.
9. Crie **OAuth client ID > Web application**.
10. Em **Authorized JavaScript origins**, adicione:

```text
https://leninn-marinho-rodrigues.github.io
http://localhost:4173
http://127.0.0.1:4173
```

O Client ID deve terminar com:

```text
.apps.googleusercontent.com
```

## 2. Publicar o Client ID no GitHub Pages

Com `gh` autenticado, rode na raiz do projeto:

```powershell
.\scripts\configure-google-oauth.ps1 -GoogleClientId "SEU_CLIENT_ID.apps.googleusercontent.com"
```

Para ativar Agenda junto com contatos:

```powershell
.\scripts\configure-google-oauth.ps1 -GoogleClientId "SEU_CLIENT_ID.apps.googleusercontent.com" -ImportCalendar
```

O script salva estes segredos no GitHub:

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CONTACTS_SCOPE`
- `VITE_GOOGLE_CALENDAR_SCOPE`
- `VITE_GOOGLE_IMPORT_CALENDAR`

Depois ele dispara o workflow `Deploy Grafy`.

## 3. Firebase é opcional para este protótipo

O fluxo mínimo funcional usa Google Identity Services direto no front-end e salva a sessão no navegador.

Firebase Auth pode ser usado depois para uma conta mais persistente, multiusuário e pronta para backend. Se usar Firebase, habilite o provedor Google e informe também:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`

## 4. Observação importante sobre qualquer pessoa testar

Para o app funcionar com qualquer conta Google fora da lista de testadores, o consent screen precisa estar publicado e compatível com as regras do Google para escopos sensíveis.

Durante a fase de teste, adicione os emails do chefe/colegas como **Test users** no OAuth consent screen. Para liberar amplamente, envie a verificação do app no Google Cloud.

## 5. Como validar

1. Aguarde o deploy finalizar.
2. Abra `https://leninn-marinho-rodrigues.github.io/grafy-cogmo-prototype/#/cadastro/empresarios`.
3. Clique em **Continuar com Google**.
4. Escolha a conta Google.
5. Autorize acesso aos contatos.
6. O Grafy deve abrir o dashboard com os contatos reais importados.

Se o Google abrir, mas voltar sem contatos, confirme:

- People API habilitada.
- Escopo `contacts.readonly` incluído no consent screen.
- Usuário está como test user, se o app ainda estiver em modo teste.
- O domínio `https://leninn-marinho-rodrigues.github.io` está em Authorized JavaScript origins.
