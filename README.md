# Kanban Pro - Sistema de Gestão de Projetos

Sistema completo de Kanban online com integração ao sistema de escalas, autenticação Firebase, gráficos Gantt, relatórios em PDF/imagem e envio por email.

## Funcionalidades

- **Quadro Kanban** com drag-and-drop (5 colunas: Backlog, A Fazer, Em Progresso, Revisão, Concluído)
- **Autenticação Firebase** (email/senha, Google)
- **Gráfico Gantt** interativo com zoom, exportação PDF e PNG
- **Relatórios completos** com gráficos (pizza, barras, área)
- **Exportação PDF** com tabelas formatadas e métricas
- **Exportação PNG** (captura de tela dos relatórios)
- **Envio por email** dos relatórios via EmailJS
- **Modo demo** para testar sem configurar Firebase
- **Gerenciamento de projetos** com cores e membros
- **Filtros e busca** por tarefas, prioridade e tags
- **UI moderna** responsiva com Tailwind CSS

## Tecnologias

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Firebase (Auth + Firestore)
- Recharts (gráficos)
- jsPDF + jspdf-autotable (relatórios PDF)
- html2canvas (captura de tela)
- EmailJS (envio de emails)
- Lucide React (ícones)
- date-fns (manipulação de datas)

## Instalação

```bash
npm install
```

## Configuração

1. Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure as variáveis do Firebase (obtenha no console do Firebase):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

3. (Opcional) Configure o EmailJS para envio de relatórios:
```
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_REPORT_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
```

## Modo Demo

Clique em "Experimentar modo demo" na tela de login para explorar todas as funcionalidades sem precisar configurar o Firebase.

## Desenvolvimento

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Estrutura do Projeto

```
src/
├── components/
│   ├── auth/          # Login e registro
│   ├── kanban/        # Quadro, colunas e cards
│   ├── reports/       # Gantt, relatórios, PDF
│   ├── layout/        # Sidebar
│   └── common/        # Configurações
├── contexts/          # Auth e Kanban contexts
├── services/          # Firebase e EmailJS
├── types/             # TypeScript types
└── utils/             # Helpers e formatação
```
