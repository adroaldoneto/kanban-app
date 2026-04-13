# Kanban Online + Firebase + Escala

Aplicação web (Next.js) para Kanban operacional, com:

- autenticação Firebase (cliente + verificação de token no backend),
- integração com sistema de escala existente,
- relatório geral em Gantt (JSON/SVG/PNG),
- relatório diário (JSON/PDF/SVG/PNG),
- envio de relatório por e-mail (SMTP).

## Stack

- Next.js (App Router)
- TypeScript
- Firebase Auth + Firebase Admin + Firestore
- Zod (validação)
- PDFKit (PDF)
- `sharp` (SVG -> PNG)
- Nodemailer (SMTP)

## Como rodar

1. Instale dependências:

```bash
npm install
```

2. Copie variáveis:

```bash
cp .env.example .env.local
```

3. Preencha as variáveis do Firebase, integração de escala e SMTP.

4. Rode em desenvolvimento:

```bash
npm run dev
```

5. Abra `http://localhost:3000`.

## Integração com sistema de escala

O endpoint `POST /api/integrations/schedule/sync` busca dados do serviço externo:

- Base URL: `SCHEDULE_API_BASE_URL`
- Caminho esperado: `/shifts`
- Query params enviados: `start` e `end`
- Header opcional: `Authorization: Bearer ${SCHEDULE_API_KEY}`

Formato aceito no retorno:

```json
[
  {
    "id": "turno-1",
    "title": "Plantao Manha",
    "startAt": "2026-04-13T08:00:00Z",
    "endAt": "2026-04-13T16:00:00Z",
    "member": "Maria"
  }
]
```

Também aceita envelope `{ "shifts": [...] }` ou `{ "items": [...] }`.

## Endpoints principais

- `GET /api/boards`
- `GET /api/tasks?boardId=default`
- `POST /api/tasks`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`
- `POST /api/integrations/schedule/sync`
- `GET /api/integrations/schedule/shifts`
- `GET /api/reports/gantt?boardId=default&as=json|svg|png`
- `GET /api/reports/daily?boardId=default&date=YYYY-MM-DD&format=json|pdf|svg|png`
- `POST /api/reports/daily/email`

## Envio por e-mail

Sim, é possível disparar por e-mail.

Configure SMTP no `.env.local`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Depois use o formulário na tela ou chame `POST /api/reports/daily/email`.

## Observações de produção

- Criar índices no Firestore conforme crescimento de consultas.
- Proteger CORS/origem para endpoints de integração.
- Adicionar fila assíncrona para envio de e-mails em volume alto.
- Implementar regras de segurança do Firestore por `ownerId`.
