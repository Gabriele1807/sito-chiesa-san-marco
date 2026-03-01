/**
 * Google Drive URL utilities
 *
 * Converte i link di condivisione di Google Drive in URL utilizzabili
 * per visualizzare immagini, embed PDF e download diretto.
 *
 * Formati supportati in input:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/uc?export=view&id=FILE_ID
 */

/**
 * Estrae il FILE_ID da un URL di Google Drive.
 * Ritorna null se l'URL non è un link Google Drive riconosciuto.
 */
export function extractGDriveId(url: string): string | null {
  if (!url) return null;

  // Formato: /file/d/FILE_ID/
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // Formato: ?id=FILE_ID o &id=FILE_ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  return null;
}

/**
 * Verifica se un URL è un link di Google Drive.
 */
export function isGDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes("drive.google.com") || url.includes("docs.google.com");
}

/**
 * Converte un URL di Google Drive in un URL diretto per visualizzare immagini.
 * Se non è un URL Google Drive, ritorna l'URL originale.
 */
export function toGDriveImageUrl(url: string): string {
  if (!url) return "";
  const id = extractGDriveId(url);
  if (id) {
    return `https://lh3.googleusercontent.com/d/${id}`;
  }
  return url;
}

/**
 * Converte un URL di Google Drive in un URL per embed PDF in iframe.
 * Se non è un URL Google Drive, ritorna l'URL originale.
 */
export function toGDrivePreviewUrl(url: string): string {
  if (!url) return "";
  const id = extractGDriveId(url);
  if (id) {
    return `https://drive.google.com/file/d/${id}/preview`;
  }
  return url;
}

/**
 * Converte un URL di Google Drive in un URL per download diretto.
 * Se non è un URL Google Drive, ritorna l'URL originale.
 */
export function toGDriveDownloadUrl(url: string): string {
  if (!url) return "";
  const id = extractGDriveId(url);
  if (id) {
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }
  return url;
}

/**
 * Determina se un URL punta a un file PDF (per Google Drive o URL diretto).
 */
export function isPdfUrl(url: string): boolean {
  if (!url) return false;
  // Se è Google Drive, non possiamo sapere dal URL — dipende dal contesto
  // Per URL diretti, controlla l'estensione
  return url.toLowerCase().endsWith(".pdf");
}
