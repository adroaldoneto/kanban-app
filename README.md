# Kanban Online + Integração de Escala

Sistema web completo com:

- **Kanban online** com drag-and-drop entre colunas
- **Autenticação Firebase** (Google) com fallback de modo demo
- **Integração com sistema de escala** via API REST (`VITE_SCALE_API_URL`)
- **Relatório geral em visual Gantt**
- **Relatórios diários em PDF e imagem (foto)**
- **Disparo por e-mail** via Firebase Cloud Functions

## Stack

- React 19 + TypeScript + Vite
- Firebase Auth + Firestore + Functions
- jsPDF + html2canvas + file-saver

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

## Variáveis de ambiente

Arquivo `.env`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_SCALE_API_URL=
```

Se o Firebase não estiver configurado, o app entra em **modo demo local**.

## Fluxo de integração com escala

1. Configure `VITE_SCALE_API_URL` para o backend do sistema de escala existente.
2. A tela **Integração Escala** sincroniza os turnos e converte para cards no Kanban.
3. Cada tarefa importada recebe `source=escala` e `shiftId`.

## Relatórios

Na aba **Relatórios**:

- Exportar PDF diário
- Exportar imagem (PNG/foto) do relatório
- Enviar relatório por e-mail

## Envio de e-mail via Firebase Functions

O frontend chama a função callable `sendReportEmail`.

Template incluído em `functions/src/index.ts`.

### Setup rápido

```bash
cd functions
npm install
npm run build
```

Defina variáveis no ambiente das Functions:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (opcional)

Depois faça deploy das functions no seu projeto Firebase.

## Estrutura principal

- `src/components/KanbanBoard.tsx` - quadro Kanban
- `src/components/GanttView.tsx` - gráfico Gantt geral
- `src/components/ReportsView.tsx` - relatório diário PDF/imagem/email
- `src/components/ScaleIntegrationView.tsx` - sincronização com escala
- `src/contexts/AuthContext.tsx` - autenticação Firebase
- `src/contexts/BoardContext.tsx` - persistência Firestore/local
