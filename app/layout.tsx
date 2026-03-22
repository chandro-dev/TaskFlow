import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { getThemeVariables } from "@/lib/patterns/abstract-factory/theme-factory";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Taskflow",
  description:
    "Plataforma de gestión de tareas con proyectos, tableros Kanban, autenticación y configuración administrativa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${bodyFont.variable} ${displayFont.variable}`}
      style={getThemeVariables("light") as CSSProperties}
    >
      <body>{children}</body>
    </html>
  );
}
