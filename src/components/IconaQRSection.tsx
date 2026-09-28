"use client";

import { useState, useSyncExternalStore } from "react";
import QRCode from "react-qr-code";
import { useTranslations } from "next-intl";
import { Download, Copy, Check } from "lucide-react";

interface Props {
  slug: string;
}

const subscribeNoop = () => () => {};

export default function IconaQRSection({ slug }: Props) {
  const t = useTranslations("icone");
  const [copied, setCopied] = useState(false);
  // L'origine si legge solo nel browser: con useState(() => window…) il server
  // renderizzava null e il client il riquadro, con errore di hydration.
  const baseUrl = useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => ""
  );
  // FIX [11] — QR download feedback state
  const [qrScaricato, setQrScaricato] = useState(false);

  const iconUrl = `${baseUrl}/icone/${slug}`;

  if (!baseUrl) return null;

  function handleCopyLink() {
    navigator.clipboard.writeText(iconUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadQR() {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(img, 0, 0, 512, 512);
      }
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-${slug}.png`;
      downloadLink.href = pngUrl;
      downloadLink.click();
      // FIX [11] — Show download confirmation feedback
      setQrScaricato(true);
      setTimeout(() => setQrScaricato(false), 2500);
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  return (
    <div className="bg-gradient-to-br from-accent/5 to-primary/5 rounded-xl border border-accent/20 p-4 sm:p-5">
      <h3 className="font-bold text-foreground mb-3">{t("qrIcona")}</h3>
      {/* Sotto i 400px il QR va sopra ai pulsanti: affiancati, "Scarica QR" andava a capo. */}
      <div className="flex flex-col items-center gap-4 min-[400px]:flex-row min-[400px]:items-start">
        <div className="shrink-0 bg-surface p-3 rounded-lg shadow-sm">
          <QRCode
            id="qr-code-svg"
            value={iconUrl}
            size={120}
            level="M"
            bgColor="#ffffff"
            fgColor="var(--color-primary)"
          />
        </div>
        <div className="w-full min-w-0 space-y-2 min-[400px]:flex-1">
          {/* FIX [11] — Download button with visual feedback */}
          <button
            onClick={handleDownloadQR}
            className={`w-full min-h-11 flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
              qrScaricato ? "bg-sage hover:bg-sage" : "bg-accent hover:bg-accent-light"
            }`}
          >
            {qrScaricato ? (
              <>
                <Check className="w-4 h-4" />
                <span>{t("qrScaricato")}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{t("scaricaQR")}</span>
              </>
            )}
          </button>
          <button
            onClick={handleCopyLink}
            className="w-full min-h-11 btn-secondary"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t("linkCopiato") : t("copiaLink")}
          </button>
          <p className="text-xs text-foreground/60 break-all mt-1">{iconUrl}</p>
        </div>
      </div>
    </div>
  );
}
