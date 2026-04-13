# Kanban online (Firebase)

Aplicação **Kanban** com **Firebase Authentication** (Google) e **Cloud Firestore**, pensada para usar o **mesmo projeto Firebase** do sistema de escala.

## Funcionalidades

- Quadro com colunas padrão (A fazer / Em andamento / Concluído), arrastar e soltar
- **Gráfico de Gantt** a partir das datas de cada cartão
- **Relatório diário** (texto + destaque para cartões que começam ou terminam hoje)
- Exportação **PDF** e **PNG** (Gantt e relatório)
- **E-mail**: link `mailto:` com assunto e corpo (anexo PDF/PNG é manual no cliente de e-mail). Para envio automático com anexo, use **Cloud Functions** + provedor (SendGrid, SES, etc.)

## Dados no Firestore

```
users/{uid}/boards/default          # metadados do quadro
users/{uid}/boards/default/columns/{columnId}
users/{uid}/boards/default/cards/{cardId}
```

Regras de segurança: restrinja leitura/escrita ao `request.auth.uid` correspondente.

## Configuração

1. Copie `.env.example` para `.env` e preencha com as chaves do Console Firebase (mesmo projeto da escala).
2. Ative **Google** como provedor em Authentication.
3. `npm install` → `npm run dev`

Sem `.env`, o app roda em **modo demo** (dados no `localStorage`).

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run lint` — ESLint
