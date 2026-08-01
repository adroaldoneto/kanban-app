# AGENTS.md

## Cursor Cloud specific instructions

This branch contains **Kanban Pro**, a React 19 + TypeScript + Vite 8 + Tailwind CSS v4
single-page app (Portuguese UI) for Kanban/project management, with Gantt charts,
PDF/PNG reports, and email. The app lives at the repository root.

### Standard commands (see `package.json` scripts)
- `npm run dev` — Vite dev server on `http://localhost:5173/`.
- `npm run build` — type-checks then builds (`tsc -b && vite build`).
- `npm run lint` — ESLint. `npm run preview` — serve the production build.

### Non-obvious notes
- **Empty `main` branch.** `main` contains only `README.md` and a `.gitignore`. All
  runnable product code lives on the `cursor/kanban-*` feature branches; this branch is
  based on `cursor/kanban-system-9d5f`. A fresh checkout of `main` has no `package.json`,
  so the startup update script guards `npm install` behind a `package.json` existence check.
- **No external services required to run or demo.** Firebase (Auth + Firestore) and
  EmailJS are optional and read from `VITE_*` env vars (`.env`, see `.env.example`).
  When they are not configured, the app still boots.
- **Demo mode is the way to exercise the app end-to-end without credentials.** On the
  login page click **"Experimentar modo demo"**. This creates an in-memory demo user and
  seeds a demo project/board (state kept locally, no Firebase calls). The full Kanban
  board, task creation, Gantt, and reports all work in this mode.
- **`npm run lint` reports pre-existing errors** in the app source (e.g. `no-explicit-any`,
  `react-hooks/set-state-in-effect`, `react-refresh/only-export-components`). These are
  from the app code as authored, not an environment problem; `npm run build` succeeds.
