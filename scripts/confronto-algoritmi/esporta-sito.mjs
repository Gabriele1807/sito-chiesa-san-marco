/**
 * Esporta i risultati del motore del sito (src/lib/calendario) per il
 * confronto con l'algoritmo Python. Non modifica nulla: importa jdn.ts,
 * coptic.ts ed easter.ts così come sono.
 *
 * Usa solo Node (>= 22.18 / 24, type stripping nativo dei file .ts): nessun
 * pacchetto in più. Un hook di risoluzione aggiunge ".ts" agli import
 * relativi senza estensione usati nel codice del sito ("./jdn").
 *
 * Uso: node scripts/confronto-algoritmi/esporta-sito.mjs <file-uscita> <anno-da> <anno-a>
 *
 * Formato dell'uscita (testo, una riga per voce):
 *   D <jdn> <annoCopto> <meseCopto> <giornoCopto> <roundTripOk 1|0>   per ogni giorno
 *   E <annoGregoriano> <jdnPasqua>                                   per ogni anno
 *   N <annoCopto> <jdn29Kiahk> <jdnNatale"29-koiak"> <jdnNatale"7-gennaio">  (risolutore)
 *   X <anno> <jdnPasqua>                                             anni <= 0, informativo
 */

import { registerHooks } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      /^\.\.?\//.test(specifier) &&
      !path.extname(specifier) &&
      context.parentURL?.endsWith(".ts")
    ) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const here = path.dirname(fileURLToPath(import.meta.url));
const lib = path.resolve(here, "../../src/lib/calendario");
const load = (name) => import(pathToFileURL(path.join(lib, name)).href);

const [
  { gregorianToJdn },
  { jdnToCoptic, copticToJdn },
  { copticEasterJdn },
  { resolveLiturgicalDay },
] = await Promise.all([load("jdn.ts"), load("coptic.ts"), load("easter.ts"), load("resolver.ts")]);
const { DEFAULT_FIXED_FEASTS } = await load("rules.ts");

/** JDN del Natale secondo il risolutore con la regola "natale" attivata sul valore dato. */
function nativityJdn(copticYear, value) {
  const config = { feasts: DEFAULT_FIXED_FEASTS, rules: { natale: { enabled: true, value } } };
  const k29 = copticToJdn(copticYear, 4, 29);
  for (let jdn = k29 - 3; jdn <= k29 + 3; jdn++) {
    if (resolveLiturgicalDay(jdn, config).feasts.some((f) => f.id === "natale")) return jdn;
  }
  return null;
}

const [out, fromArg, toArg] = process.argv.slice(2);
const from = Number(fromArg);
const to = Number(toArg);
if (!out || !Number.isInteger(from) || !Number.isInteger(to) || from > to) {
  console.error("Uso: node esporta-sito.mjs <file-uscita> <anno-da> <anno-a>");
  process.exit(2);
}

const lines = [];
const last = gregorianToJdn(to, 12, 31);
for (let jdn = gregorianToJdn(from, 1, 1); jdn <= last; jdn++) {
  const c = jdnToCoptic(jdn);
  const ok = copticToJdn(c.year, c.month, c.day) === jdn ? 1 : 0;
  lines.push(`D ${jdn} ${c.year} ${c.month} ${c.day} ${ok}`);
}
for (let y = from; y <= to; y++) lines.push(`E ${y} ${copticEasterJdn(y)}`);
// Natale per anno copto (29 Kiahk cade tra dicembre e gennaio dell'anno gregoriano copto + 284/285).
for (let cy = from - 284; cy <= to - 284; cy++) {
  lines.push(
    `N ${cy} ${copticToJdn(cy, 4, 29)} ${nativityJdn(cy, "29-koiak")} ${nativityJdn(cy, "7-gennaio")}`
  );
}
// Casi limite fuori intervallo (anni <= 0), solo informativi.
for (const y of [-100, -5, -1, 0]) lines.push(`X ${y} ${copticEasterJdn(y)}`);

writeFileSync(out, lines.join("\n") + "\n");
console.error(`[esporta-sito] ${lines.length} righe in ${out}`);
