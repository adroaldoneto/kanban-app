# Kanban Escala Suite

Aplicacao web em Next.js para operar um Kanban online com autenticacao Firebase, integracao com sistema de escala por adapter/API, visao executiva em grafico Gantt, exportacao de relatorios diarios em PDF ou imagem e disparo por email via SMTP.

## O que ja esta entregue

- Autenticacao Firebase preparada com login Google.
- Modo demo para rodar sem o projeto principal de escala.
- Quadro Kanban com drag and drop.
- Cadastro manual de cards vinculados a turnos da escala.
- Dashboard com indicadores operacionais.
- Cronograma executivo em formato Gantt.
- Relatorio diario exportavel em PDF e PNG.
- Endpoint para envio de relatorio por email com anexo.
- Prompt tecnico para levar a mesma arquitetura ao projeto real: `PROMPT_COMPLETO.md`.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Firebase Auth
- Recharts
- jsPDF + html2canvas
- Nodemailer

## Como rodar

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`.

## Variaveis de ambiente

Use o arquivo `.env.local` com base em `.env.example`.

### Firebase

Preencha:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Sem essas variaveis o app entra em modo demonstracao, mas continua funcional.

### Integracao com a escala

- `NEXT_PUBLIC_SCHEDULE_API_URL`

O adapter atual espera um JSON com esta estrutura:

```json
{
  "source": "api",
  "connected": true,
  "lastSync": "2026-04-13T03:00:00.000Z",
  "shifts": [
    {
      "id": "shift-1",
      "title": "Plantonistas - Manha",
      "team": "Equipe Alfa",
      "date": "2026-04-13T00:00:00.000Z",
      "startTime": "06:00",
      "endTime": "12:00",
      "slots": 6,
      "status": "confirmed"
    }
  ],
  "alerts": ["Mensagem opcional"],
  "integrationNotes": ["Mensagem opcional"]
}
```

Se a API nao estiver disponivel, o sistema usa dados demo.

### Email

Para disparar por email, configure:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (opcional, mas recomendado)

O envio acontece pela rota `POST /api/email-report`.

## Como integrar ao projeto real de escala

1. Substitua o adapter demo em `src/lib/schedule-adapter.ts` pela chamada autenticada para o sistema existente.
2. Grave tasks e relatorios em Firestore, Supabase ou na API principal.
3. Conecte `task.scheduleRef` ao identificador oficial do modulo de escalas.
4. Se houver usuarios/ACL no sistema atual, sincronize claims do Firebase com perfis e permissoes do backend.
5. Se quiser envio automatico, agende a rota de email com um cron job ou fila.

## Observacoes

Como o projeto principal nao estava neste repositorio, a implementacao foi feita de forma desacoplada: existe um MVP executavel agora e os pontos de integracao ja estao preparados para acoplar no sistema definitivo.
