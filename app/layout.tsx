import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { getAuthenticatedUser } from "@/lib/auth/current-user";
import type { ThemeMode } from "@/lib/domain/models";
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

function buildThemeBootstrapScript(serverPreference?: ThemeMode) {
  const lightTheme = JSON.stringify(createThemeArtifacts("light").cssVariables);
  const darkTheme = JSON.stringify(createThemeArtifacts("dark").cssVariables);
  const serializedServerPreference = JSON.stringify(serverPreference ?? null);

  return `
    (function () {
      var storageKey = "taskflow-theme";
      var serverPreference = ${serializedServerPreference};
      var stored = window.localStorage.getItem(storageKey);
      var isValidTheme = function (value) {
        return value === "light" || value === "dark" || value === "system";
      };
      var preference = isValidTheme(serverPreference)
        ? serverPreference
        : isValidTheme(stored)
          ? stored
          : "system";
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var resolved = preference === "system"
        ? (prefersDark ? "dark" : "light")
        : preference;
      var themes = { light: ${lightTheme}, dark: ${darkTheme} };
      var root = document.documentElement;

      if (isValidTheme(serverPreference)) {
        window.localStorage.setItem(storageKey, serverPreference);
      }

      root.dataset.theme = resolved;
      root.dataset.themePreference = preference;
      var variables = themes[resolved] || themes.light;
      Object.keys(variables).forEach(function (key) {
        root.style.setProperty(key, variables[key]);
      });
    })();
  `;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticatedUser = await getAuthenticatedUser();
  const initialThemeMode = authenticatedUser?.themePreference === "dark" ? "dark" : "light";
  const initialTheme = createThemeArtifacts(initialThemeMode);

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable}`}
      style={initialTheme.cssVariables as CSSProperties}
      data-theme={initialThemeMode}
      data-theme-preference={authenticatedUser?.themePreference ?? "system"}
    >
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: buildThemeBootstrapScript(authenticatedUser?.themePreference),
          }}
        />
        {children}
      </body>
    </html>
  );
}
