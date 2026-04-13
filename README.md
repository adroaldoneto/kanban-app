# Kanban Pro - Sistema de Gestão Online

Sistema completo de Kanban online com integração de escalas, gráficos Gantt, relatórios em PDF/imagem e envio por email. Autenticação via Firebase.

## Funcionalidades

- **Autenticação Firebase** — Login, registro, Google Sign-in e recuperação de senha
- **Quadro Kanban** — Drag & drop com 5 colunas (Backlog, A Fazer, Em Progresso, Revisão, Concluído)
- **Gestão de Projetos** — Múltiplos projetos com cores e descrições
- **Gestão de Equipe** — Cadastro de membros com estatísticas de produtividade
- **Sistema de Escalas** — Grade semanal com turnos (Manhã, Tarde, Noite, Folga)
- **Gráfico Gantt** — Visualização temporal das tarefas com filtros e zoom
- **Relatórios Diários** — Gráficos de distribuição, atividade semanal, produtividade por membro
- **Exportação PDF/PNG** — Relatórios e Gantt exportáveis
- **Envio por Email** — Disparo de relatórios via EmailJS
- **Dashboard** — Visão geral com KPIs, gráficos e atividade recente

## Tech Stack

- React 19 + TypeScript
- Vite
- TailwindCSS 4
- Firebase (Auth + Firestore)
- dnd-kit (drag & drop)
- Recharts (gráficos)
- jsPDF + html2canvas (exportação PDF/PNG)
- EmailJS (envio de emails)
- date-fns (manipulação de datas)
- Lucide React (ícones)

## Setup

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Copie o arquivo de ambiente e configure:

```bash
cp .env.example .env
```

4. Configure o Firebase:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com)
   - Ative Authentication (Email/Password e Google)
   - Crie um banco Firestore
   - Copie as credenciais para o `.env`

5. Configure o EmailJS (opcional, para envio de relatórios):
   - Crie uma conta no [EmailJS](https://www.emailjs.com)
   - Configure um serviço de email e template
   - Copie as credenciais para o `.env`

6. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Firestore Rules

Configure estas regras no Firestore para segurança:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null;
    }
    match /cards/{cardId} {
      allow read, write: if request.auth != null;
    }
    match /schedule/{entryId} {
      allow read, write: if request.auth != null;
    }
    match /teamMembers/{memberId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_FIREBASE_API_KEY` | Chave da API Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID do remetente |
| `VITE_FIREBASE_APP_ID` | ID do app Firebase |
| `VITE_EMAILJS_SERVICE_ID` | ID do serviço EmailJS |
| `VITE_EMAILJS_TEMPLATE_ID` | ID do template EmailJS |
| `VITE_EMAILJS_PUBLIC_KEY` | Chave pública EmailJS |
