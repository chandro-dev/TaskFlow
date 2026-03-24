import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { createThemeArtifacts } from "@/lib/patterns/abstract-factory/theme-factory";

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
    "Plataforma de gestion de tareas con proyectos, tableros Kanban, autenticacion y configuracion administrativa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Abstract Factory traceability: the server shell asks for the light theme
  // family once so the first render already ships with a consistent token set.
  const initialTheme = createThemeArtifacts("light");

  return (
    <html
      lang="es"
      className={`${bodyFont.variable} ${displayFont.variable}`}
      style={initialTheme.cssVariables as CSSProperties}
    >
      <body>{children}</body>
    </html>
  );
}
