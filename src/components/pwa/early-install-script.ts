/**
 * Script inline eseguito prima di React (incluso nel layout radice):
 * `beforeinstallprompt` può arrivare mentre la pagina si sta ancora
 * idratando e andrebbe perso. install-store.ts lo recupera da
 * `window.__smInstallPrompt`. File separato (non "use client") perché il
 * layout server deve importarne il valore, non un riferimento client.
 */
export const EARLY_INSTALL_PROMPT_SCRIPT =
  "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__smInstallPrompt=e;});";
