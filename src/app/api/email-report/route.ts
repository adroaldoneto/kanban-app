import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

const payloadSchema = z.object({
  to: z.string().email("Informe um email valido."),
  subject: z.string().min(3, "Assunto muito curto."),
  html: z.string().min(1, "Corpo do email obrigatorio."),
  attachmentName: z.string().optional(),
  attachmentDataUrl: z.string().optional(),
});

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function decodeAttachment(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    contentType: match[1],
    content: Buffer.from(match[2], "base64"),
  };
}

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    const transporter = buildTransport();
    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;

    if (!transporter || !from) {
      return NextResponse.json(
        {
          success: false,
          message: "SMTP nao configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e opcionalmente SMTP_FROM.",
        },
        { status: 400 },
      );
    }

    const attachment = payload.attachmentDataUrl ? decodeAttachment(payload.attachmentDataUrl) : null;

    await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      attachments: attachment
        ? [
            {
              filename: payload.attachmentName ?? "relatorio.png",
              content: attachment.content,
              contentType: attachment.contentType,
            },
          ]
        : [],
    });

    return NextResponse.json({ success: true, message: "Email enviado com sucesso." });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Payload invalido."
        : error instanceof Error
          ? error.message
          : "Erro desconhecido.";

    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
