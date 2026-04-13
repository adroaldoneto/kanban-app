import nodemailer from "nodemailer";

import { ApiError } from "@/lib/http";

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  filename: string;
  contentType: string;
  content: Buffer;
};

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new ApiError(
      400,
      "SMTP não configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS.",
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendReportEmail(params: SendEmailParams) {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  if (!from) {
    throw new ApiError(
      400,
      "Endereço de origem não configurado. Defina SMTP_FROM.",
    );
  }

  const transport = createTransport();
  await transport.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    attachments: [
      {
        filename: params.filename,
        content: params.content,
        contentType: params.contentType,
      },
    ],
  });
}
