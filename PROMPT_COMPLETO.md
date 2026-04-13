# Prompt completo para integrar no projeto real

Use o texto abaixo no projeto original onde o sistema de escala ja existe:

---

Crie um modulo completo de Kanban online dentro do sistema de escala existente com os seguintes requisitos:

## Objetivo

Construir um painel operacional e executivo que una gestao de tarefas com a operacao de escala, mantendo rastreabilidade entre cards, turnos, equipes e entregas diarias.

## Requisitos obrigatorios

1. **Autenticacao Firebase**
   - Login com Google e opcionalmente email/senha.
   - Persistir sessao.
   - Mapear perfil do usuario autenticado para permissoes do sistema atual.
   - Exibir modo fallback caso Firebase nao esteja configurado.

2. **Kanban online**
   - Colunas: Backlog, Planejado, Em execucao, Revisao e Concluido.
   - Drag and drop entre colunas.
   - Criacao, edicao e exclusao de cards.
   - Campos do card: titulo, descricao, prioridade, responsavel, data inicio, data entrega, progresso, etiquetas, bloqueios, referencia da escala e turno vinculado.
   - Atualizacao em tempo real quando houver multiplos usuarios.

3. **Integracao com o sistema de escala existente**
   - Consumir a API/modulo atual de escalas.
   - Permitir vincular um card a um turno, posto, equipe ou referencia de escala.
   - Mostrar alertas quando houver cobertura parcial, conflito de agenda ou turno sem responsavel.
   - Sincronizar `scheduleRef` com o identificador oficial do sistema legado/principal.

4. **Dashboard executivo**
   - Cards ativos, cards concluidos, atrasos, produtividade por responsavel e quantidade de turnos ativos.
   - Graficos de distribuicao por status e carga por equipe.
   - Destaques do dia e bloqueios operacionais.

5. **Grafico Gantt geral**
   - Exibir janela de execucao das tasks.
   - Mostrar relacao entre datas das tasks e agenda/escala.
   - Permitir filtros por equipe, status, prioridade e periodo.

6. **Relatorios diarios**
   - Gerar relatorio diario consolidado com: entregas do dia, atividades em andamento, bloqueios, alertas da escala, produtividade por equipe e pendencias.
   - Exportar em PDF.
   - Exportar em imagem/PNG (foto do dashboard/relatorio).
   - Registrar historico de relatorios gerados.

7. **Disparo por email**
   - Criar endpoint/servico para enviar o relatorio diario por email.
   - Permitir anexar PDF e/ou PNG.
   - Usar SMTP configuravel por variaveis de ambiente.
   - Preparar modo de envio manual e possibilidade de automacao futura via cron/fila.

## Requisitos tecnicos

- Preferir componentes reutilizaveis.
- Tipar tudo com TypeScript.
- Adicionar adaptadores para que o Kanban funcione mesmo quando a API de escala estiver indisponivel.
- Incluir validacoes de payload com schema.
- Garantir responsividade para desktop e tablet.
- Criar README com setup, variaveis e contrato da integracao.
- Se o projeto ja tiver design system, seguir o padrao existente.
- Se o projeto ja tiver backend, integrar sem duplicar autentificacao ou cadastros.

## Entregaveis

- Tela principal do Kanban.
- Dashboard com graficos.
- Gantt.
- Exportacao PDF/PNG.
- Envio por email.
- Adaptador/integracao com escala.
- Documentacao de ambiente e deploy.

## Criterios de aceite

- Usuario autenticado consegue entrar no modulo.
- Cards podem ser movimentados e associados a uma escala/turno.
- Gantt mostra a linha do tempo corretamente.
- Relatorio diario exporta em PDF e imagem.
- Email e enviado com sucesso quando SMTP estiver configurado.
- Sistema continua operando em modo fallback quando a integracao principal estiver fora.

---

Sugestao de arquitetura:
- frontend em Next.js/React
- Firebase Auth para login
- API route/backend para envio SMTP
- adapter para API de escala
- armazenamento em Firestore ou banco do sistema atual
- Recharts para indicadores
- jsPDF/html2canvas para exportacao
