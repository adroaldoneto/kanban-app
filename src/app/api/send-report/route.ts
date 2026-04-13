import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

interface SendReportPayload {
  to?: string;
  subject?: string;
  html?: string;
  imageDataUrl?: string;
  attachmentName?: string;
}

function parseDataUrl(dataUrl: string): Buffer {
  const [, base64] = dataUrl.split(",");
  return Buffer.from(base64 ?? "", "base64");
}

export async function POST(request: Request) {
  const body = (await request.json()) as SendReportPayload;

  if (!body.to || !body.subject || !body.html) {
    return NextResponse.json(
      { error: "Campos obrigatórios ausentes: to, subject e html." },
      { status: 400 },
    );
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM;

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    return NextResponse.json({
      ok: true,
      simulated: true,
      message:
        "SMTP não configurado neste ambiente. O fluxo de disparo está pronto; basta preencher SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e SMTP_FROM.",
    });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: smtpFrom,
    to: body.to,
    subject: body.subject,
    html: body.html,
    attachments: body.imageDataUrl
      ? [
          {
            filename: body.attachmentName ?? "relatorio-diario.png",
            content: parseDataUrl(body.imageDataUrl),
          },
        ]
      : [],
  });

  return NextResponse.json({
    ok: true,
    message: `Relatório enviado com sucesso para ${body.to}.`,
  });
}
