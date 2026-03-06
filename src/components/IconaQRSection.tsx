"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { useTranslations } from "next-intl";
import { Download, Copy, Check } from "lucide-react";

interface Props {
  slug: string;
}

export default function IconaQRSection({ slug }: Props) {
  const t = useTranslations("icone");
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  // FIX [11] — QR download feedback state
  const [qrScaricato, setQrScaricato] = useState(false);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

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
    <div className="bg-gradient-to-br from-accent/5 to-primary/5 rounded-xl border border-accent/20 p-5">
      <h3 className="font-bold text-gray-900 mb-3">{t("qrIcona")}</h3>
      <div className="flex items-start gap-4">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <QRCode
            id="qr-code-svg"
            value={iconUrl}
            size={120}
            level="M"
            bgColor="#ffffff"
            fgColor="#1E3A8A"
          />
        </div>
        <div className="space-y-2 flex-1">
          {/* FIX [11] — Download button with visual feedback */}
          <button
            onClick={handleDownloadQR}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white
                       text-sm font-medium rounded-lg transition-colors duration-150 cursor-pointer ${qrScaricato
                         ? 'bg-green-800 hover:bg-green-800'
                         : 'bg-blue-900 hover:bg-blue-800'}`}
          >
            {qrScaricato ? (
              <>
                <Check className="w-4 h-4" />
                <span>QR scaricato!</span>
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-primary
                       text-sm font-medium rounded-lg border border-primary/20 btn-hover cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t("linkCopiato") : t("copiaLink")}
          </button>
          <p className="text-xs text-gray-500 break-all mt-1">{iconUrl}</p>
        </div>
      </div>
    </div>
  );
}
