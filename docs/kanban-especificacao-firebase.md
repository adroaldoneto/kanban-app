# Especificacao do modulo Kanban integrado ao sistema de escala

## 1. Objetivo

Criar um sistema de Kanban online integrado ao sistema de escala ja existente, reutilizando a autenticacao do Firebase e oferecendo:

- gestao visual de tarefas em quadros, colunas e cards
- vinculacao entre tarefas e escalas, equipes, turnos ou setores
- relatorio geral em grafico Gantt
- relatorios diarios exportaveis em PDF e imagem
- envio manual ou automatico de relatorios por e-mail

Como o sistema principal nao esta disponivel neste repositorio, esta especificacao foi escrita para servir como base de implementacao no projeto real.

## 2. Escopo funcional

### 2.1 Perfis de usuario

- **Administrador**
  - cria quadros, colunas e automacoes
  - define permissoes
  - configura disparos por e-mail
  - acessa todos os relatorios
- **Gestor**
  - cria e move cards
  - vincula tarefas a escalas e equipes
  - gera relatorios do seu setor
  - agenda envios por e-mail
- **Colaborador**
  - visualiza quadros permitidos
  - atualiza status dos cards
  - comenta, anexa evidencias e conclui atividades

### 2.2 Funcionalidades principais do Kanban

1. **Quadros**
   - criacao de multiplos quadros por unidade, setor ou equipe
   - filtros por periodo, responsavel, status, equipe, prioridade e turno
   - visualizacao por quadro, lista, calendario e timeline

2. **Colunas**
   - colunas padrao: Backlog, A Fazer, Em Andamento, Em Revisao, Concluido
   - colunas personalizaveis por quadro
   - limites WIP opcionais por coluna

3. **Cards**
   - titulo, descricao rica, prioridade, etiquetas e checklist
   - responsavel principal e participantes
   - data de inicio, vencimento e previsao
   - anexos, comentarios e historico de movimentacoes
   - subtarefas
   - relacao com turno, escala, posto, unidade ou equipe

4. **Automacoes**
   - mover card automaticamente quando checklist for concluido
   - notificar responsavel quando prazo estiver vencendo
   - gerar relatorio diario ao final do turno
   - disparar e-mail ao concluir tarefa critica

5. **Auditoria**
   - registrar criacao, edicao, mudanca de coluna, conclusao e reabertura
   - salvar usuario, timestamp e origem da alteracao

## 3. Integracao com o sistema de escala existente

### 3.1 Autenticacao

- usar **Firebase Authentication** ja existente no projeto principal
- manter login unico
- aproveitar claims, roles ou perfis ja usados no sistema atual
- sincronizar sessao entre modulo de escala e modulo Kanban

### 3.2 Dados compartilhados

O Kanban deve consumir ou espelhar os seguintes dados do sistema de escala:

- usuarios
- equipes
- unidades
- turnos
- escalas planejadas
- status operacionais relevantes

### 3.3 Regras de integracao

- um card pode ser vinculado a uma escala especifica
- um card pode nascer automaticamente de um evento do sistema de escala
- mudancas importantes na escala podem atualizar cards relacionados
- relatorios devem permitir cruzar execucao da tarefa com periodo da escala

## 4. Arquitetura sugerida

### 4.1 Frontend

Se o projeto atual usa React ou Next.js, o modulo Kanban pode ser implementado com:

- React ou Next.js
- TypeScript
- Tailwind CSS ou o design system ja existente
- biblioteca drag and drop moderna
- biblioteca de grafico Gantt
- geracao de PDF no cliente ou via backend

### 4.2 Backend

### Firebase recomendado

- **Firebase Auth** para login
- **Cloud Firestore** para dados operacionais
- **Cloud Functions** para automacoes, envio de e-mail e geracao de relatorios
- **Firebase Storage** para anexos, PDFs e imagens geradas
- **Cloud Scheduler** para disparos recorrentes

### Servicos complementares

- **SendGrid**, **Resend** ou **SMTP corporativo** para envio de e-mail
- **Puppeteer** em Cloud Functions para renderizar PDF e imagem dos relatorios
- biblioteca de graficos para timeline/Gantt

## 5. Modelo de dados sugerido

### 5.1 Colecoes principais no Firestore

### `boards`

```json
{
  "name": "Kanban Operacional",
  "unitId": "unidade-01",
  "teamId": "time-alpha",
  "createdBy": "uid-admin",
  "createdAt": "timestamp",
  "visibility": "private",
  "members": ["uid-admin", "uid-gestor"]
}
```

### `boardColumns`

```json
{
  "boardId": "board-01",
  "name": "Em Andamento",
  "position": 3,
  "wipLimit": 8,
  "color": "#2563eb"
}
```

### `cards`

```json
{
  "boardId": "board-01",
  "columnId": "column-03",
  "title": "Validar equipe do turno noturno",
  "description": "Confirmar cobertura e pendencias do plantao",
  "priority": "high",
  "status": "in_progress",
  "assigneeId": "uid-gestor",
  "watchers": ["uid-admin", "uid-colaborador"],
  "labels": ["turno-noturno", "escala"],
  "startDate": "timestamp",
  "dueDate": "timestamp",
  "scaleId": "scale-2026-04-13-noite",
  "teamId": "time-alpha",
  "unitId": "unidade-01",
  "checklistProgress": 50,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### `cardComments`

```json
{
  "cardId": "card-01",
  "authorId": "uid-colaborador",
  "message": "Checklist operacional iniciado",
  "createdAt": "timestamp"
}
```

### `dailyReports`

```json
{
  "boardId": "board-01",
  "date": "2026-04-13",
  "unitId": "unidade-01",
  "teamId": "time-alpha",
  "totalCards": 42,
  "completedCards": 18,
  "delayedCards": 5,
  "pdfUrl": "storage-url",
  "imageUrl": "storage-url",
  "generatedAt": "timestamp",
  "generatedBy": "system"
}
```

### `emailSchedules`

```json
{
  "name": "Relatorio Diario Turno Noite",
  "enabled": true,
  "frequency": "daily",
  "time": "23:30",
  "recipients": ["gestor@empresa.com", "operacao@empresa.com"],
  "reportType": "daily_pdf",
  "boardId": "board-01",
  "teamId": "time-alpha"
}
```

## 6. Relatorios

### 6.1 Relatorio geral em Gantt

### Objetivo

Consolidar a execucao das tarefas ao longo do tempo e comparar planejamento versus execucao.

### Conteudo

- cards agrupados por quadro, equipe, unidade ou escala
- barra com data de inicio prevista e real
- barra com data de conclusao prevista e real
- destaque para atrasos
- marco de turnos importantes
- filtros por periodo, responsavel, prioridade, equipe e status

### Indicadores

- total de tarefas abertas
- total concluido no periodo
- percentual concluido no prazo
- tarefas atrasadas
- tempo medio por coluna
- gargalos por equipe ou turno

### 6.2 Relatorio diario

### Formatos

- PDF
- PNG ou JPG

### Conteudo sugerido

- cabecalho com data, unidade, equipe e turno
- resumo executivo
- cards concluidos no dia
- cards em andamento
- cards atrasados
- bloqueios e observacoes
- anexos ou evidencias mais recentes
- assinatura digital ou identificacao do emissor

### Gatilhos

- geracao manual pelo gestor
- geracao automatica ao final do turno
- geracao agendada por horario fixo

## 7. Envio por e-mail

Sim, **e possivel disparar por e-mail**.

### 7.1 Formas de envio

1. **Manual**
   - usuario gera relatorio e clica em "Enviar por e-mail"
2. **Agendado**
   - Cloud Scheduler ou cron interno dispara o envio
3. **Por evento**
   - ao concluir um card critico
   - ao fechar o turno
   - ao detectar atraso acima de um limite

### 7.2 Estrategia tecnica

- Cloud Function gera o PDF e a imagem
- arquivo sobe para o Firebase Storage
- outra Function monta o corpo do e-mail
- servico de e-mail envia anexos ou links publicos autenticados

### 7.3 Conteudo do e-mail

- assunto dinamico com data, unidade e turno
- resumo executivo
- indicadores principais
- anexo PDF
- imagem inline opcional
- link para abrir o Kanban diretamente

## 8. Regras de permissao e seguranca

- somente usuarios autenticados podem acessar o modulo
- leitura e escrita filtradas por unidade, equipe e papel do usuario
- anexos devem respeitar o mesmo escopo de permissao do card
- logs de auditoria nao devem poder ser apagados por usuarios comuns
- relatorios enviados por e-mail devem evitar dados sensiveis fora do escopo permitido

## 9. Requisitos nao funcionais

- interface responsiva para desktop e tablet
- atualizacao em tempo real
- rastreabilidade completa das alteracoes
- exportacao confiavel dos relatorios
- baixo tempo de resposta para movimentacao de cards
- escalabilidade por unidade, equipe e periodo

## 10. Fluxo resumido do sistema

1. usuario autentica com Firebase
2. frontend carrega perfil e permissoes
3. quadros disponiveis sao listados conforme equipe e unidade
4. usuario cria ou move cards
5. sistema grava auditoria
6. servicos automaticos consolidam dados do dia
7. relatorio diario e gerado em PDF/imagem
8. sistema envia por e-mail para destinatarios configurados
9. painel de relatorios mostra historico e Gantt geral

## 11. Criterios de aceite

- login reaproveita autenticacao Firebase do sistema atual
- usuario autorizado consegue mover cards por drag and drop
- card pode ser vinculado a uma escala existente
- relatorio geral exibe timeline tipo Gantt com filtros
- relatorio diario exporta PDF e imagem
- envio por e-mail funciona manualmente e por agendamento
- permissoes respeitam unidade, equipe e papel
- historico de alteracoes fica registrado

## 12. Fases recomendadas de implementacao

### Fase 1

- autenticacao integrada
- quadros, colunas e cards
- comentarios, anexos e auditoria

### Fase 2

- vinculo com escalas e equipes
- filtros avancados
- dashboard operacional

### Fase 3

- relatorio Gantt
- relatorio diario em PDF/imagem
- disparo por e-mail

### Fase 4

- automacoes
- templates de relatorio
- alertas e monitoramento

## 13. Dependencias para o projeto real

Para implementar no sistema existente, sera necessario ter acesso a:

- stack atual do frontend
- estrutura do Firebase ja em uso
- modelo de usuarios, equipes e escalas
- regras atuais de permissao
- identidade visual
- ambiente de envio de e-mails

## 14. Resultado esperado

Ao final da implementacao, o sistema tera um modulo Kanban integrado ao ambiente operacional ja existente, permitindo acompanhamento visual de tarefas, relatorios executivos e distribuicao automatizada por e-mail sem duplicar autenticacao nem cadastro de usuarios.
