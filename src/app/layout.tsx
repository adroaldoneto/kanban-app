import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Kanban Scale Suite",
  description:
    "Kanban online com autenticação Firebase, visão Gantt, relatórios diários em PDF/imagem e envio por e-mail.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
