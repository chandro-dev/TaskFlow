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

function buildThemeBootstrapScript() {
  const lightTheme = JSON.stringify(createThemeArtifacts("light").cssVariables);
  const darkTheme = JSON.stringify(createThemeArtifacts("dark").cssVariables);

  return `
    (function () {
      var storageKey = "taskflow-theme";
      var stored = window.localStorage.getItem(storageKey);
      var preference = stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "system";
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var resolved = preference === "system"
        ? (prefersDark ? "dark" : "light")
        : preference;
      var themes = { light: ${lightTheme}, dark: ${darkTheme} };
      var root = document.documentElement;
      root.dataset.theme = resolved;
      root.dataset.themePreference = preference;
      var variables = themes[resolved] || themes.light;
      Object.keys(variables).forEach(function (key) {
        root.style.setProperty(key, variables[key]);
      });
    })();
  `;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialTheme = createThemeArtifacts("light");

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable}`}
      style={initialTheme.cssVariables as CSSProperties}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: buildThemeBootstrapScript() }} />
        {children}
      </body>
    </html>
  );
}
