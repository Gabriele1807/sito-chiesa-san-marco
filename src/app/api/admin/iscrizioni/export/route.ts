import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/auth/permissions";
import { getEventoById } from "@/lib/mongo/content";
import { getIscrizioniByEvento } from "@/lib/mongo/registrations";
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

const HEADERS = [
  "#",
  "Nome",
  "Cognome",
  "Nome padre",
  "Cognome padre",
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
    r.telefono || "",
    r.email || "",
    r.note || "",
    formatData(r.createdAt || ""),
  ]);
}

export async function GET(request: Request) {
  const h = await headers();
  const ruolo = h.get("x-admin-ruolo");
  if (!ruolo || !hasPermission(ruolo, "iscrizioni.read")) {
    return NextResponse.json({ success: false, error: "Permessi insufficienti" }, { status: 403 });
  }

  const url = new URL(request.url);
  const eventoId = url.searchParams.get("eventoId");
  const format = (url.searchParams.get("format") || "excel").toLowerCase();

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

  // ---------------- PDF (HTML stampabile) ----------------
  if (format === "pdf") {
    const headerCells = HEADERS.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
    const bodyRows = rows
      .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`)
      .join("");

    const postiInfo =
      typeof evento.postiDisponibili === "number" && evento.postiDisponibili > 0
        ? `<p class="meta">Posti totali: ${evento.postiDisponibili} · Iscritti: ${rows.length} · Rimasti: ${Math.max(0, evento.postiDisponibili - rows.length)}</p>`
        : `<p class="meta">Iscritti: ${rows.length} · Posti illimitati</p>`;

    const html = `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8" />
<title>${escapeHtml(baseName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #222; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #1a1a2e; }
  .meta { color: #666; font-size: 13px; margin: 2px 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #d4af37; color: #fff; text-align: left; padding: 7px 8px; border: 1px solid #b8961f; }
  td { padding: 6px 8px; border: 1px solid #ddd; }
  tr:nth-child(even) td { background: #faf8f1; }
  .footer { margin-top: 24px; color: #999; font-size: 11px; }
  @media print { .noprint { display: none; } body { margin: 12px; } }
  .noprint { margin-bottom: 16px; }
  .btn { background:#1a1a2e;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:13px;cursor:pointer; }
</style></head>
<body>
  <div class="noprint">
    <button class="btn" onclick="window.print()">Stampa / Salva come PDF</button>
  </div>
  <h1>Iscritti — ${escapeHtml(evento.titolo)}</h1>
  <p class="meta">${escapeHtml(formatData(evento.data))} · ${escapeHtml(evento.luogo || "")}</p>
  ${postiInfo}
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows || `<tr><td colspan="${HEADERS.length}" style="text-align:center;color:#999;">Nessun iscritto</td></tr>`}</tbody>
  </table>
  <p class="footer">Generato il ${escapeHtml(formatData(new Date().toISOString()))} — Chiesa San Marco</p>
  <script>window.addEventListener("load", function(){ setTimeout(function(){ window.print(); }, 400); });</script>
</body></html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json({ success: false, error: "Formato non supportato" }, { status: 400 });
}
