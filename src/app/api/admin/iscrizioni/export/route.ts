import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { hasPermission } from "@/lib/auth/permissions";
import { getEventoById } from "@/lib/mongo/content";
import { getIscrizioniByEvento } from "@/lib/mongo/registrations";
import { requireAdminSession } from "@/lib/auth/session";
import type { IscrizioneEvento } from "@/types";

/**
 * GET /api/admin/iscrizioni/export?eventoId=XXX&format=excel|pdf
 *
 * Genera l'esportazione della lista iscritti senza dipendenze esterne:
 *  - excel: file .xls in formato HTML-table (aperto nativamente da Excel)
 *  - pdf:   documento HTML stampabile (Salva come PDF dal browser)
 */

function escapeHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatData(iso: string): string {
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso || "";
  }
}

function sanitizeFilename(s: string): string {
  return (s || "evento")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
    .slice(0, 60) || "evento";
}

type ExportColumnKey =
  | "index"
  | "nome"
  | "cognome"
  | "padreNome"
  | "padreCognome"
  | "ha_pagato"
  | "telefono"
  | "email"
  | "note"
  | "createdAt";

type ExportColumn = {
  key: ExportColumnKey;
  label: string;
  width: number;
  value: (row: IscrizioneEvento, index: number) => string;
};

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "index", label: "#", width: 0.45, value: (_row, index) => String(index + 1) },
  { key: "nome", label: "Nome", width: 1.1, value: (row) => row.nome || "" },
  { key: "cognome", label: "Cognome", width: 1.1, value: (row) => row.cognome || "" },
  { key: "padreNome", label: "Nome padre", width: 1.1, value: (row) => row.padreNome || "" },
  { key: "padreCognome", label: "Cognome padre", width: 1.1, value: (row) => row.padreCognome || "" },
  { key: "ha_pagato", label: "Pagamento", width: 0.9, value: (row) => (row.ha_pagato ? "PAGATO" : "") },
  { key: "telefono", label: "Telefono", width: 1.15, value: (row) => row.telefono || "" },
  { key: "email", label: "Email", width: 1.6, value: (row) => row.email || "" },
  { key: "note", label: "Note", width: 1.8, value: (row) => row.note || "" },
  { key: "createdAt", label: "Data iscrizione", width: 1.2, value: (row) => formatData(row.createdAt || "") },
];

const HEADERS = [
  "#",
  "Nome",
  "Cognome",
  "Nome padre",
  "Cognome padre",
  "Pagato",
  "Telefono",
  "Email",
  "Note",
  "Data iscrizione",
];

function rowsFrom(iscrizioni: IscrizioneEvento[]): string[][] {
  return iscrizioni.map((r, i) => [
    String(i + 1),
    r.nome || "",
    r.cognome || "",
    r.padreNome || "",
    r.padreCognome || "",
    r.ha_pagato ? "Si" : "No",
    r.telefono || "",
    r.email || "",
    r.note || "",
    formatData(r.createdAt || ""),
  ]);
}

function parseSelectedColumns(raw: string | null): ExportColumnKey[] {
  const allKeys = EXPORT_COLUMNS.map((column) => column.key);
  if (!raw?.trim()) {
    return allKeys;
  }

  const selected = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is ExportColumnKey => allKeys.includes(value as ExportColumnKey));

  return selected.length > 0 ? selected : allKeys;
}

function truncateForWidth(value: string, width: number): string {
  const normalized = (value || "").replace(/\s+/g, " ").trim();
  const maxChars = Math.max(8, Math.floor(width / 4.9));
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxChars - 1))}\u2026`;
}

async function buildPdfBuffer(
  evento: Awaited<ReturnType<typeof getEventoById>>,
  iscrizioni: IscrizioneEvento[],
  selectedColumns: ExportColumnKey[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageSize: [number, number] = [841.89, 595.28];
  const margin = 32;
  const rowHeight = 18;
  const bodyFontSize = 8;
  const headerFontSize = 8;
  const titleFontSize = 18;
  const metaFontSize = 10;

  const activeColumns = EXPORT_COLUMNS.filter((column) => selectedColumns.includes(column.key));
  const totalWeight = activeColumns.reduce((sum, column) => sum + column.width, 0);
  const tableWidth = pageSize[0] - margin * 2;
  const resolvedColumns = activeColumns.map((column) => ({
    ...column,
    resolvedWidth: (column.width / totalWeight) * tableWidth,
  }));

  let page = pdfDoc.addPage(pageSize);
  let y = pageSize[1] - margin;

  const drawPageHeader = () => {
    page.drawText(`Iscritti - ${evento?.titolo ?? "Evento"}`, {
      x: margin,
      y,
      size: titleFontSize,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.18),
    });
    y -= 20;
    page.drawText(`${formatData(evento?.data || "")} - ${evento?.luogo || ""}`, {
      x: margin,
      y,
      size: metaFontSize,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
    y -= 14;
    const postiInfo =
      typeof evento?.postiDisponibili === "number" && evento.postiDisponibili > 0
        ? `Posti totali: ${evento.postiDisponibili}  |  Iscritti: ${iscrizioni.length}  |  Rimasti: ${Math.max(0, evento.postiDisponibili - iscrizioni.length)}`
        : `Iscritti: ${iscrizioni.length}  |  Posti illimitati`;
    page.drawText(postiInfo, {
      x: margin,
      y,
      size: metaFontSize,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
    y -= 22;
  };

  const drawTableHeader = () => {
    let x = margin;
    for (const column of resolvedColumns) {
      page.drawRectangle({
        x,
        y: y - rowHeight + 2,
        width: column.resolvedWidth,
        height: rowHeight,
        color: rgb(0.83, 0.69, 0.22),
      });
      page.drawText(column.label, {
        x: x + 5,
        y: y - 12,
        size: headerFontSize,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      x += column.resolvedWidth;
    }
    y -= rowHeight;
  };

  const ensureRowSpace = () => {
    if (y - rowHeight < margin + 24) {
      page = pdfDoc.addPage(pageSize);
      y = pageSize[1] - margin;
      drawPageHeader();
      drawTableHeader();
    }
  };

  drawPageHeader();
  drawTableHeader();

  if (iscrizioni.length === 0) {
    page.drawText("Nessun iscritto", {
      x: margin,
      y: y - 12,
      size: 11,
      font,
      color: rgb(0.55, 0.55, 0.55),
    });
  } else {
    iscrizioni.forEach((row, index) => {
      ensureRowSpace();
      let x = margin;
      const isEvenRow = index % 2 === 1;
      if (isEvenRow) {
        page.drawRectangle({
          x: margin,
          y: y - rowHeight + 2,
          width: tableWidth,
          height: rowHeight,
          color: rgb(0.98, 0.97, 0.94),
        });
      }

      resolvedColumns.forEach((column) => {
        const text = truncateForWidth(column.value(row, index), column.resolvedWidth);
        page.drawRectangle({
          x,
          y: y - rowHeight + 2,
          width: column.resolvedWidth,
          height: rowHeight,
          borderWidth: 0.5,
          borderColor: rgb(0.86, 0.86, 0.86),
        });
        page.drawText(text || "-", {
          x: x + 4,
          y: y - 12,
          size: bodyFontSize,
          font,
          color: rgb(0.16, 0.16, 0.16),
        });
        x += column.resolvedWidth;
      });

      y -= rowHeight;
    });
  }

  page.drawText(`Generato il ${formatData(new Date().toISOString())} - Chiesa San Marco`, {
    x: margin,
    y: 16,
    size: 9,
    font,
    color: rgb(0.55, 0.55, 0.55),
  });

  return pdfDoc.save();
}

export async function GET(request: Request) {
  const adminUser = await requireAdminSession();
  if (!adminUser || !hasPermission(adminUser.ruolo, "iscrizioni.read")) {
    return NextResponse.json({ success: false, error: "Permessi insufficienti" }, { status: 403 });
  }

  const url = new URL(request.url);
  const eventoId = url.searchParams.get("eventoId");
  const format = (url.searchParams.get("format") || "excel").toLowerCase();
  const selectedColumns = parseSelectedColumns(url.searchParams.get("columns"));

  if (!eventoId) {
    return NextResponse.json({ success: false, error: "eventoId mancante" }, { status: 400 });
  }

  const evento = await getEventoById(eventoId);
  if (!evento) {
    return NextResponse.json({ success: false, error: "Evento non trovato" }, { status: 404 });
  }

  const iscrizioni = await getIscrizioniByEvento(eventoId);
  const rows = rowsFrom(iscrizioni);
  const baseName = `iscritti_${sanitizeFilename(evento.titolo)}`;

  // ---------------- EXCEL (.xls come tabella HTML) ----------------
  if (format === "excel" || format === "xls") {
    const headerCells = HEADERS.map((c) => `<th style="background:#d4af37;color:#fff;border:1px solid #999;padding:6px;text-align:left;">${escapeHtml(c)}</th>`).join("");
    const bodyRows = rows
      .map(
        (r) =>
          `<tr>${r
            .map((c) => `<td style="border:1px solid #ccc;padding:6px;">${escapeHtml(c)}</td>`)
            .join("")}</tr>`
      )
      .join("");

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8" /></head>
<body>
<table border="1">
<tr><th colspan="${HEADERS.length}" style="font-size:14px;padding:8px;">Iscritti — ${escapeHtml(evento.titolo)} (${rows.length})</th></tr>
<tr>${headerCells}</tr>
${bodyRows}
</table>
</body></html>`;

    return new NextResponse("\uFEFF" + html, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.xls"`,
      },
    });
  }

  // ---------------- PDF reale server-side ----------------
  if (format === "pdf") {
    const pdfBytes = await buildPdfBuffer(evento, iscrizioni, selectedColumns);
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
      },
    });
  }

  return NextResponse.json({ success: false, error: "Formato non supportato" }, { status: 400 });
}
