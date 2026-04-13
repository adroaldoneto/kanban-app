# Prompt completo para implementar o modulo Kanban no projeto real

Copie o texto abaixo e use no repositorio onde o sistema de escala realmente existe.

---

Voce e um engenheiro de software senior e precisa implementar um **modulo de Kanban online** dentro de um sistema de escala ja existente.

## Contexto do projeto

- ja existe um sistema de escala em producao
- a autenticacao atual usa **Firebase Authentication**
- o Kanban deve ser integrado ao sistema atual, sem criar um login separado
- usuarios, equipes, unidades e escalas ja existem no sistema
- o novo modulo deve reutilizar ao maximo a arquitetura, componentes visuais e padroes do projeto

## Objetivo

Implementar um modulo Kanban completo, integrado ao sistema de escala, com:

1. autenticacao Firebase reaproveitada
2. quadros, colunas e cards com drag and drop
3. vinculo entre cards e dados da escala
4. relatorio geral em grafico Gantt
5. relatorios diarios exportaveis em PDF e imagem
6. envio manual e automatico por e-mail
7. trilha de auditoria e permissoes por perfil

## Regras obrigatorias

### Integracao

- nao criar base de usuarios paralela
- reaproveitar sessao, roles e permissoes do Firebase ja existentes
- integrar cards com entidades reais do sistema: escala, turno, equipe, unidade, posto ou equivalente
- se houver design system, reutilizar os componentes existentes
- se houver API propria alem do Firebase, respeitar os servicos atuais do projeto

### Funcionalidades do Kanban

- listar quadros disponiveis por perfil do usuario
- criar, editar, arquivar e excluir quadros conforme permissao
- criar, editar, mover e concluir cards
- criar colunas customizaveis por quadro
- permitir comentarios, checklists, anexos e etiquetas
- permitir filtros por status, periodo, prioridade, equipe, unidade, responsavel e escala
- registrar historico de alteracoes por card

### Integracao com escala

- permitir vincular cada card a um turno, escala, equipe ou unidade
- mostrar no detalhe do card as informacoes da escala relacionada
- permitir filtros cruzados entre cards e escalas
- opcionalmente criar cards automaticos a partir de eventos da escala, se a base atual do projeto suportar isso

### Relatorio geral em Gantt

- criar uma visualizacao tipo Gantt para tarefas
- cada barra deve representar uma tarefa ou agrupamento
- mostrar inicio previsto, inicio real, fim previsto e fim real quando houver
- destacar atrasos
- permitir agrupamento por equipe, unidade, escala ou responsavel
- permitir exportar o relatorio ou pelo menos imprimir com layout organizado

### Relatorio diario

- gerar relatorio diario por quadro, unidade, equipe e periodo
- incluir resumo, cards concluidos, cards em andamento, cards atrasados e bloqueios
- permitir exportar em PDF
- permitir exportar em imagem PNG ou JPG
- armazenar os arquivos gerados com rastreabilidade

### Envio por e-mail

- implementar disparo manual de relatorios por e-mail
- implementar agendamento automatico
- permitir configurar destinatarios por quadro, equipe ou unidade
- anexar PDF quando possivel
- quando o anexo for grande, enviar link seguro para download
- usar a infraestrutura mais adequada ao projeto: Cloud Functions + SendGrid, Resend, SMTP corporativo ou equivalente

### Seguranca

- garantir acesso apenas para usuarios autenticados
- restringir leitura e escrita por perfil, equipe, unidade e escopo operacional
- proteger anexos e relatorios no Storage
- registrar logs de auditoria das acoes relevantes

## Requisitos tecnicos

- identificar a stack atual do projeto antes de implementar
- manter consistencia com o padrao de pastas, hooks, services, controllers, repositories e componentes ja existentes
- usar TypeScript se o projeto ja usar TypeScript
- criar codigo limpo, modular e com baixo acoplamento
- evitar quebrar fluxos existentes do sistema de escala
- tratar loading, erro, vazio e estados offline se o projeto ja suportar isso
- adicionar testes apenas quando fizer sentido e seguindo o padrao atual do repositorio

## Entregas esperadas

1. modulo Kanban funcional integrado ao sistema atual
2. rotas ou paginas do Kanban
3. componentes de quadro, coluna, card e filtros
4. integracao com dados da escala
5. tela de relatorio Gantt
6. geracao de relatorios diarios em PDF e imagem
7. rotina de envio por e-mail
8. regras de permissao
9. documentacao tecnica breve explicando arquitetura e configuracao

## Modelo de dados sugerido

Considere entidades semelhantes a:

- Board
- BoardColumn
- Card
- CardComment
- CardAttachment
- CardChecklistItem
- DailyReport
- EmailSchedule
- AuditLog

Adapte os nomes ao padrao do projeto real.

## Criterios de aceite

- login existente continua funcionando e o Kanban respeita a autenticacao Firebase
- usuario consegue criar e mover cards
- card pode ser associado a dados reais de escala
- relatorio Gantt mostra visao temporal das tarefas
- relatorio diario pode ser baixado em PDF e imagem
- relatorio pode ser enviado por e-mail manualmente e por agendamento
- trilha de auditoria registra as principais alteracoes
- nao ha regressao nos fluxos do sistema ja existente

## Forma de trabalho

1. primeiro, explore o codigo para entender a arquitetura atual
2. identifique onde ja existem autenticacao Firebase, entidades de escala, permissoes e relatorios
3. proponha a arquitetura do modulo integrada ao projeto
4. implemente em pequenos passos consistentes com o padrao existente
5. valide os fluxos principais
6. documente qualquer configuracao nova de Firebase, Storage, e-mail e scheduler

## Observacoes importantes

- se o projeto nao tiver servico de e-mail pronto, implemente uma opcao desacoplada e configuravel por variaveis de ambiente
- se o projeto nao tiver gerador de PDF, use uma abordagem confiavel e reproduzivel
- se o projeto nao tiver biblioteca Gantt, escolha uma integravel com a stack atual
- mantenha o visual consistente com o restante do sistema

Agora analise o repositorio real, descreva rapidamente a arquitetura encontrada e implemente a solucao completa seguindo essas exigencias.

---

## Sugestao de stack quando for necessario escolher

Se o sistema real permitir escolhas e nao tiver uma stack fechada para esse modulo, a combinacao abaixo costuma funcionar bem:

- frontend: Next.js + React + TypeScript
- UI: Tailwind CSS ou design system existente
- drag and drop: dnd-kit
- estado e cache: React Query ou padrao existente
- auth e dados: Firebase Auth + Firestore
- arquivos: Firebase Storage
- automacoes: Cloud Functions
- relatorios PDF e imagem: Puppeteer
- e-mail: Resend, SendGrid ou SMTP corporativo
- Gantt: biblioteca de timeline/Gantt compativel com React

## Resposta curta para a pergunta sobre e-mail

Sim. O disparo por e-mail pode ser implementado com Cloud Functions gerando o PDF/imagem, armazenando o arquivo no Firebase Storage e enviando o relatorio por SendGrid, Resend ou SMTP corporativo, tanto manualmente quanto de forma agendada.
