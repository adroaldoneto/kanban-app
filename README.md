# KanFlow — Sistema Integrado de Kanban & Escalas

Sistema completo de gerenciamento de projetos com Kanban, escalas de equipe, relatórios Gantt, exportação PDF/imagem e disparo de e-mails.

## Funcionalidades

- **Kanban Board** — Drag-and-drop, colunas configuráveis, prioridades, etiquetas, checklist, comentários
- **Integração com Escalas** — Calendário semanal de turnos integrado ao projeto
- **Gráfico Gantt** — Linha do tempo visual das tarefas com datas
- **Relatórios PDF** — Geração de relatórios diários em PDF completo
- **Exportação como Imagem** — Captura do painel de relatórios em PNG
- **Disparo de E-mails** — Envio de relatórios por e-mail via EmailJS
- **Dashboard** — Métricas, gráficos e KPIs em tempo real
- **Autenticação Firebase** — Login com e-mail/senha e Google

## Tecnologias

- **Frontend**: React 19 + TypeScript + Vite
- **Estilo**: Tailwind CSS v4
- **Estado**: Zustand
- **Banco de dados**: Firebase Firestore (real-time)
- **Autenticação**: Firebase Authentication
- **Drag & Drop**: @dnd-kit
- **Gráficos**: Recharts
- **PDF**: jsPDF
- **Captura de tela**: html2canvas
- **E-mail**: EmailJS

## Configuração

### 1. Clonar e instalar

```bash
cd kanban-app
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
# Firebase (https://console.firebase.google.com)
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000:web:000

# EmailJS (https://www.emailjs.com) — opcional para disparo de e-mails
VITE_EMAILJS_SERVICE_ID=service_xxx
VITE_EMAILJS_TEMPLATE_ID=template_xxx
VITE_EMAILJS_PUBLIC_KEY=sua_public_key
```

### 3. Configurar Firebase

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Ative **Authentication** → Métodos: E-mail/senha e Google
3. Ative **Firestore Database** em modo de produção
4. Configure as regras do Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /projects/{projectId} {
      allow read, write: if request.auth != null 
        && request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
    }
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
    match /columns/{columnId} {
      allow read, write: if request.auth != null;
    }
    match /shifts/{shiftId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Configurar EmailJS (opcional)

1. Crie conta em [emailjs.com](https://www.emailjs.com)
2. Crie um serviço de e-mail (Gmail, Outlook, etc.)
3. Crie um template com as variáveis:
   - `{{to_name}}` — Nome do destinatário
   - `{{message}}` — Corpo do e-mail
   - `{{project_name}}` — Nome do projeto
   - `{{report_date}}` — Data do relatório
   - `{{total_tasks}}`, `{{completed_tasks}}`, `{{in_progress_tasks}}`, `{{overdue_tasks}}`, `{{completion_rate}}`
4. Adicione as credenciais ao `.env`

### 5. Executar

```bash
npm run dev       # Desenvolvimento
npm run build     # Build de produção
npm run preview   # Visualizar build
```

## Estrutura do Projeto

```
kanban-app/
├── src/
│   ├── components/
│   │   ├── auth/         # ProtectedRoute
│   │   ├── kanban/       # TaskCard, KanbanColumn, TaskModal
│   │   └── layout/       # Sidebar, Header, AppLayout
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── KanbanPage.tsx
│   │   ├── SchedulePage.tsx
│   │   ├── GanttPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── EmailPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── stores/           # Zustand (authStore, kanbanStore, scheduleStore)
│   ├── types/            # TypeScript interfaces
│   └── utils/
│       ├── reportGenerator.ts   # PDF e captura de imagem
│       └── emailService.ts      # Disparo de e-mails
├── .env.example
└── package.json
```

## Uso

### Kanban
- Crie um projeto pela sidebar
- Adicione tarefas com título, descrição, prioridade, data, horas estimadas
- Use drag-and-drop para mover entre colunas
- Adicione checklist, comentários e etiquetas coloridas

### Escalas
- Navegue semana a semana
- Clique no `+` de qualquer dia para adicionar um turno
- Gerencie status: Agendado, Confirmado, Concluído, Ausente

### Gantt
- Tarefas com `startDate` ou `dueDate` aparecem na linha do tempo
- Barras coloridas por prioridade e status
- Linha vermelha indica tarefas atrasadas

### Relatórios
- Selecione a data do relatório
- Exporte como **PDF** completo com gráficos e tabelas
- Salve como **imagem PNG** do painel

### E-mail
- Adicione destinatários (nome + e-mail)
- Escolha relatório diário automático ou mensagem personalizada
- Envie para múltiplos destinatários de uma vez
