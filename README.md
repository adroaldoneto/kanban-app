# Kanban Online com Firebase, Gantt e Email

Aplicacao web de Kanban com:

- autenticacao de usuarios com Firebase Auth (cliente) e validacao de token no backend (Firebase Admin);
- integracao com sistema de escala via API externa (com fallback mock);
- quadro Kanban com drag and drop entre colunas;
- relatorio geral visual em grafico de Gantt;
- relatorio diario com exportacao em PDF ou imagem (PNG);
- disparo de relatorio por e-mail com anexo.

## Stack

- Node.js + Express (API e servidor estatico)
- Firebase Web SDK (frontend)
- Firebase Admin SDK (backend)
- Frappe Gantt
- html2canvas + jsPDF
- Nodemailer

## Como executar

1. Instale dependencias:

```bash
npm install
```

2. Configure ambiente:

```bash
cp .env.example .env
```

3. Ajuste as variaveis no `.env`.

4. Execute:

```bash
npm run dev
```

5. Acesse `http://localhost:3000`.

## Variaveis de ambiente principais

### Firebase (Frontend)

- `FIREBASE_WEB_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_WEB_APP_ID`
- `FIREBASE_MESSAGING_SENDER_ID`

### Firebase Admin (Backend)

Use uma das opcoes:

1. `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON completo em string), ou
2. `FIREBASE_SERVICE_ACCOUNT_PATH` (caminho para arquivo JSON), ou
3. `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

Se `FIREBASE_REQUIRED=true`, a API exige configuracao Firebase Admin valida.

### Integracao com Escala

- `SCALE_API_URL` (ex.: `https://api.seusistema.com`)
- `SCALE_API_TOKEN` (opcional)

Sem `SCALE_API_URL`, a API retorna escalas de exemplo para desenvolvimento.

### E-mail (SMTP)

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true`/`false`)
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`

## Endpoints da API

- `GET /api/health`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`
- `GET /api/gantt`
- `GET /api/reports/daily?date=YYYY-MM-DD`
- `POST /api/reports/email`
- `GET /api/scale/shifts`

## Observacoes sobre o "projeto de escala"

Como o projeto de escala nao esta neste repositório, esta implementacao cria um ponto de integracao desacoplado (`/api/scale/shifts`) para conectar no sistema real por URL/token. Assim, voce ja pode evoluir a integracao sem reescrever o Kanban.