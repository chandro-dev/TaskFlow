export type ReportFormat = "html" | "csv" | "json";

export interface ReportDocument {
  title: string;
  generatedAt: string;
  summary: Record<string, number | string>;
  columns: string[];
  rows: Array<Record<string, number | string>>;
}

export interface ReportRenderer {
  readonly contentType: string;
  readonly extension: string;
  render(document: ReportDocument): string;
}

function escapeHtml(value: number | string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeCsv(value: number | string) {
  const raw = String(value);

  if (!/[",\n]/.test(raw)) {
    return raw;
  }

  return `"${raw.replaceAll('"', '""')}"`;
}

export class HtmlReportRenderer implements ReportRenderer {
  readonly contentType = "text/html; charset=utf-8";
  readonly extension = "html";

  render(document: ReportDocument) {
    const summary = Object.entries(document.summary)
      .map(
        ([label, value]) =>
          `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`,
      )
      .join("");
    const head = document.columns
      .map((column) => `<th>${escapeHtml(column)}</th>`)
      .join("");
    const rows = document.rows
      .map(
        (row) =>
          `<tr>${document.columns
            .map((column) => `<td>${escapeHtml(row[column] ?? "")}</td>`)
            .join("")}</tr>`,
      )
      .join("");

    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(document.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #172033; }
    h1 { margin-bottom: 4px; }
    .meta { color: #5c667a; margin-bottom: 24px; }
    ul { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; padding: 0; list-style: none; }
    li { border: 1px solid #d8deea; border-radius: 8px; padding: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border-bottom: 1px solid #d8deea; padding: 10px; text-align: left; }
    th { background: #f4f7fb; }
  </style>
</head>
<body>
  <h1>${escapeHtml(document.title)}</h1>
  <p class="meta">Generado: ${escapeHtml(document.generatedAt)}</p>
  <ul>${summary}</ul>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
  }
}

export class CsvReportRenderer implements ReportRenderer {
  readonly contentType = "text/csv; charset=utf-8";
  readonly extension = "csv";

  render(document: ReportDocument) {
    const header = document.columns.map(escapeCsv).join(",");
    const rows = document.rows.map((row) =>
      document.columns.map((column) => escapeCsv(row[column] ?? "")).join(","),
    );

    return [header, ...rows].join("\n");
  }
}

export class JsonReportRenderer implements ReportRenderer {
  readonly contentType = "application/json; charset=utf-8";
  readonly extension = "json";

  render(document: ReportDocument) {
    return JSON.stringify(document, null, 2);
  }
}

export function createReportRenderer(format: ReportFormat): ReportRenderer {
  const renderers: Record<ReportFormat, ReportRenderer> = {
    html: new HtmlReportRenderer(),
    csv: new CsvReportRenderer(),
    json: new JsonReportRenderer(),
  };

  return renderers[format];
}
