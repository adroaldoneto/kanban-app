# Kanban Scale Suite

Base funcional de um **kanban online** preparada para integrar com um sistema de escala existente usando **Firebase Authentication**, com:

- quadro Kanban online com drag and drop
- vínculo de cartões a turnos/plantões
- visão geral em **gráfico Gantt**
- **relatório diário** exportável em **PDF** ou **imagem**
- endpoint para **disparo por e-mail** via SMTP
- fallback em **modo demonstração** porque o sistema original não está neste repositório

## Stack

- Next.js 16 + React 19 + TypeScript
- Firebase Auth + Firestore (opcional, quando configurado)
- html-to-image + jsPDF para exportações
- Nodemailer para envio de e-mail

## Como rodar

```bash
npm install
cp .env.example .env.local
npm run dev
```

A aplicação sobe em `http://localhost:3000`.

## Variáveis de ambiente

Preencha o arquivo `.env.local` com as credenciais abaixo:

### Firebase

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Se essas variáveis não forem preenchidas, o projeto entra em **modo demonstração**, mantendo o fluxo completo para validação.

### E-mail SMTP

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Sem SMTP configurado, o envio responde em **modo simulado** com a estrutura pronta para ativação.

## O que já foi entregue

### 1. Kanban operacional

- criação de cartões
- colunas backlog / a fazer / em andamento / concluído
- drag and drop nativo
- prioridade, datas, responsável e tags
- vínculo de cartão com turno da escala

### 2. Integração com escala

Como o sistema real não está aqui, o projeto entrega um **adaptador preparado** em `src/lib/schedule-adapter.ts` e usa dados de demonstração em `src/lib/demo-data.ts`.

Para integrar com o sistema existente, basta substituir a origem demo pelos dados reais da escala e reaproveitar o mesmo projeto Firebase usado hoje.

### 3. Gantt geral

Todo cartão com data aparece automaticamente no gráfico Gantt, permitindo visualização consolidada de:

- janelas de execução
- progresso
- responsável
- vínculo com plantão/turno

### 4. Relatório diário

O relatório diário mostra:

- total de cards
- concluídas
- em andamento
- atrasadas
- pessoas na escala
- destaques
- bloqueios

Exportações disponíveis:

- **PDF**
- **imagem (PNG)**

### 5. Envio por e-mail

Existe um endpoint em `src/app/api/send-report/route.ts` que envia o relatório por e-mail usando SMTP.

O fluxo já suporta anexo de imagem do relatório diário.

## Próximo passo para integrar com seu sistema real

1. apontar o Firebase do projeto existente no `.env.local`
2. trocar o adaptador demo pela API do sistema de escala
3. decidir se os cartões vão ficar no Firestore ou em um backend próprio
4. configurar o SMTP/serviço transacional para disparos automáticos

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```
