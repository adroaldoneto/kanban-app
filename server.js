import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import { promises as fs } from "fs";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = path.join(__dirname, "data", "db.json");
const DEFAULT_COLUMNS = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "A Fazer" },
  { id: "doing", title: "Em Andamento" },
  { id: "done", title: "Concluido" }
];

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

let firebaseEnabled = false;

initializeFirebaseAdmin();

app.get("/api/health", async (_req, res) => {
  const db = await readDb();
  res.json({
    ok: true,
    firebaseEnabled,
    taskCount: db.tasks.length
  });
});

app.get("/config.js", (_req, res) => {
  res.type("application/javascript");
  res.send(`window.APP_CONFIG = {
  apiBaseUrl: "${process.env.API_BASE_URL || ""}",
  firebase: {
    apiKey: "${process.env.FIREBASE_WEB_API_KEY || ""}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || ""}",
    projectId: "${process.env.FIREBASE_PROJECT_ID || ""}",
    appId: "${process.env.FIREBASE_WEB_APP_ID || ""}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || ""}"
  }
};`);
});

app.use("/api", authenticateRequest);

app.get("/api/tasks", async (_req, res) => {
  const db = await readDb();
  res.json({ tasks: db.tasks, columns: db.columns });
});

app.post("/api/tasks", async (req, res) => {
  const db = await readDb();
  const payload = normalizeTaskCreatePayload(req.body);
  if (!payload.title) {
    return res.status(400).json({ error: "Titulo da tarefa e obrigatorio." });
  }

  const task = {
    id: uuidv4(),
    title: payload.title,
    description: payload.description,
    status: payload.status || "backlog",
    priority: payload.priority || "media",
    responsible: payload.responsible,
    startDate: payload.startDate,
    dueDate: payload.dueDate,
    shiftId: payload.shiftId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user.uid
  };

  db.tasks.push(task);
  await writeDb(db);

  return res.status(201).json(task);
});

app.patch("/api/tasks/:taskId", async (req, res) => {
  const db = await readDb();
  const task = db.tasks.find((item) => item.id === req.params.taskId);

  if (!task) {
    return res.status(404).json({ error: "Tarefa nao encontrada." });
  }

  const payload = normalizeTaskUpdatePayload(req.body);
  if (Object.prototype.hasOwnProperty.call(payload, "title") && !payload.title) {
    return res.status(400).json({ error: "Titulo da tarefa nao pode ficar vazio." });
  }

  Object.assign(task, payload, { updatedAt: new Date().toISOString() });
  await writeDb(db);

  return res.json(task);
});

app.delete("/api/tasks/:taskId", async (req, res) => {
  const db = await readDb();
  const initialSize = db.tasks.length;
  db.tasks = db.tasks.filter((item) => item.id !== req.params.taskId);

  if (db.tasks.length === initialSize) {
    return res.status(404).json({ error: "Tarefa nao encontrada." });
  }

  await writeDb(db);
  return res.status(204).send();
});

app.get("/api/gantt", async (_req, res) => {
  const db = await readDb();
  const ganttTasks = db.tasks
    .filter((task) => task.startDate && task.dueDate)
    .map((task) => ({
      id: task.id,
      name: task.title,
      start: task.startDate,
      end: task.dueDate,
      progress: task.status === "done" ? 100 : task.status === "doing" ? 60 : 25,
      custom_class: `priority-${task.priority}`
    }));

  res.json({ tasks: ganttTasks });
});

app.get("/api/reports/daily", async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const db = await readDb();
  const tasks = db.tasks;

  const dueToday = tasks.filter((task) => task.dueDate === date);
  const createdToday = tasks.filter((task) => task.createdAt.slice(0, 10) === date);
  const doneToday = tasks.filter(
    (task) => task.updatedAt.slice(0, 10) === date && task.status === "done"
  );

  const statusCount = tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    { backlog: 0, todo: 0, doing: 0, done: 0 }
  );

  const byResponsible = tasks.reduce((acc, task) => {
    const key = task.responsible || "Sem responsavel";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  res.json({
    date,
    totalTasks: tasks.length,
    dueTodayCount: dueToday.length,
    createdTodayCount: createdToday.length,
    doneTodayCount: doneToday.length,
    statusCount,
    byResponsible,
    dueToday
  });
});

app.get("/api/scale/shifts", async (_req, res) => {
  if (!process.env.SCALE_API_URL) {
    return res.json({
      source: "mock",
      shifts: [
        { id: "manha", label: "Escala - Manha" },
        { id: "tarde", label: "Escala - Tarde" },
        { id: "noite", label: "Escala - Noite" }
      ]
    });
  }

  try {
    const response = await fetch(`${process.env.SCALE_API_URL}/shifts`, {
      headers: buildScaleHeaders()
    });
    if (!response.ok) {
      throw new Error(`Scale API retornou ${response.status}`);
    }

    const shifts = await response.json();
    return res.json({ source: "integration", shifts });
  } catch (error) {
    return res.status(502).json({
      error: "Falha ao consultar API de escala.",
      details: error.message
    });
  }
});

app.post("/api/reports/email", async (req, res) => {
  const { to, subject, message, attachmentBase64, fileName, mimeType } = req.body;

  if (!to || !subject) {
    return res.status(400).json({ error: "Campos 'to' e 'subject' sao obrigatorios." });
  }

  const transporter = buildSmtpTransport();
  if (!transporter) {
    return res.status(400).json({
      error: "SMTP nao configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS."
    });
  }

  const mailPayload = {
    from: process.env.MAIL_FROM || "kanban@local.test",
    to,
    subject,
    text: message || "Relatorio do Kanban em anexo."
  };

  if (attachmentBase64 && fileName && mimeType) {
    mailPayload.attachments = [
      {
        filename: fileName,
        content: Buffer.from(attachmentBase64, "base64"),
        contentType: mimeType
      }
    ];
  }

  try {
    const info = await transporter.sendMail(mailPayload);
    return res.json({ messageId: info.messageId, accepted: info.accepted });
  } catch (error) {
    return res.status(502).json({
      error: "Falha ao enviar email.",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Kanban server em http://localhost:${PORT}`);
});

async function authenticateRequest(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const required = process.env.FIREBASE_REQUIRED === "true";

  if (firebaseEnabled) {
    if (!token) {
      return res.status(401).json({ error: "Token Firebase ausente." });
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = { uid: decoded.uid, email: decoded.email };
      return next();
    } catch {
      return res.status(401).json({ error: "Token Firebase invalido." });
    }
  }

  if (required) {
    return res.status(500).json({
      error: "FIREBASE_REQUIRED=true, mas credenciais do Firebase Admin nao foram configuradas."
    });
  }

  req.user = { uid: "dev-user", email: "dev@local" };
  return next();
}

function initializeFirebaseAdmin() {
  try {
    let credential = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const serviceAccount = JSON.parse(
        readJsonFileSync(serviceAccountPath)
      );
      credential = admin.credential.cert(serviceAccount);
    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      });
    }

    if (credential && admin.apps.length === 0) {
      admin.initializeApp({ credential });
      firebaseEnabled = true;
      console.log("Firebase Admin inicializado.");
    } else {
      console.log("Firebase Admin nao configurado, rodando em modo desenvolvimento.");
    }
  } catch (error) {
    console.error("Erro ao iniciar Firebase Admin:", error.message);
    firebaseEnabled = false;
  }
}

function buildScaleHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (process.env.SCALE_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.SCALE_API_TOKEN}`;
  }
  return headers;
}

function buildSmtpTransport() {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  });
}

function normalizeTaskCreatePayload(payload = {}) {
  return {
    title: payload.title?.trim(),
    description: payload.description?.trim() || "",
    status: payload.status || "backlog",
    priority: payload.priority || "media",
    responsible: payload.responsible?.trim() || "",
    startDate: payload.startDate || "",
    dueDate: payload.dueDate || "",
    shiftId: payload.shiftId || ""
  };
}

function normalizeTaskUpdatePayload(payload = {}) {
  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(payload, "title")) {
    normalized.title = (payload.title || "").trim();
  }
  if (Object.prototype.hasOwnProperty.call(payload, "description")) {
    normalized.description = (payload.description || "").trim();
  }
  if (Object.prototype.hasOwnProperty.call(payload, "status")) {
    normalized.status = payload.status || "";
  }
  if (Object.prototype.hasOwnProperty.call(payload, "priority")) {
    normalized.priority = payload.priority || "";
  }
  if (Object.prototype.hasOwnProperty.call(payload, "responsible")) {
    normalized.responsible = (payload.responsible || "").trim();
  }
  if (Object.prototype.hasOwnProperty.call(payload, "startDate")) {
    normalized.startDate = payload.startDate || "";
  }
  if (Object.prototype.hasOwnProperty.call(payload, "dueDate")) {
    normalized.dueDate = payload.dueDate || "";
  }
  if (Object.prototype.hasOwnProperty.call(payload, "shiftId")) {
    normalized.shiftId = payload.shiftId || "";
  }

  return normalized;
}

async function readDb() {
  await ensureDbFile();
  const content = await fs.readFile(DB_PATH, "utf8");
  const db = JSON.parse(content);
  db.tasks = db.tasks || [];
  db.columns = db.columns || DEFAULT_COLUMNS;
  return db;
}

async function writeDb(db) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

async function ensureDbFile() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await writeDb({ tasks: [], columns: DEFAULT_COLUMNS });
  }
}

function readJsonFileSync(filePath) {
  return readFileSync(filePath, "utf8");
}
