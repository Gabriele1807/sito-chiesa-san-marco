const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function walk(dir, extFilter = []) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, extFilter));
    } else if (extFilter.some(ext => full.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

function flatten(obj, prefix = '') {
  const res = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(res, flatten(value, full));
    } else {
      res[full] = value;
    }
  }
  return res;
}

function collectTranslationKeys() {
  const files = walk('src', ['.ts', '.tsx']);
  const keyRegex = /\b(?:t|tNav|tContact|tIscrizioni|tAuth|tc)\(\s*['\"]([^'\"]+)['\"]\s*([,)])/g;
  const namespaceRegex = /\b(?:useTranslations|getTranslations)\(\s*['\"]([^'\"]+)['\"]\s*\)/g;
  const keys = new Set();
  const namespaces = new Set();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = keyRegex.exec(content))) {
      keys.add(match[1]);
    }
    while ((match = namespaceRegex.exec(content))) {
      namespaces.add(match[1]);
    }
  }
  return { keys: Array.from(keys).sort(), namespaces: Array.from(namespaces).sort() };
}

function collectHardcodedStrings() {
  const files = walk('src', ['.tsx']);
  const entries = [];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isJsxText(node)) {
        const text = node.getText().replace(/\s+/g, ' ').trim();
        if (text.length >= 2 && /[A-Za-zÀ-ž٠-٩]/.test(text)) {
          entries.push({ file, line: sf.getLineAndCharacterOfPosition(node.pos).line + 1, text });
        }
      } else if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
        const text = node.initializer.text.trim();
        if (text.length >= 2 && /[A-Za-zÀ-ž٠-٩]/.test(text)) {
          entries.push({ file, line: sf.getLineAndCharacterOfPosition(node.initializer.pos).line + 1, text });
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sf);
  }
  const grouped = entries.reduce((acc, item) => {
    const key = `${item.text}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(`${item.file}:${item.line}`);
    return acc;
  }, {});
  return Object.entries(grouped).map(([text, locs]) => ({ text, locs })).sort((a,b)=>b.locs.length-a.locs.length);
}

function main() {
  const translations = collectTranslationKeys();
  const it = flatten(JSON.parse(fs.readFileSync('src/messages/it.json', 'utf8')));
  const ar = flatten(JSON.parse(fs.readFileSync('src/messages/ar.json', 'utf8')));
  const missingInIt = translations.keys.filter(key => !Object.hasOwn(it, key));
  const missingInAr = translations.keys.filter(key => !Object.hasOwn(ar, key));
  const unusedIt = Object.keys(it).filter(key => !translations.keys.includes(key));
  const unusedAr = Object.keys(ar).filter(key => !translations.keys.includes(key));
  const hardcoded = collectHardcodedStrings().filter(item => !item.text.match(/^\s*$/));

  fs.writeFileSync('translation-audit-report.json', JSON.stringify({
    namespaces: translations.namespaces,
    usedKeys: translations.keys,
    missingInIt,
    missingInAr,
    unusedIt,
    unusedAr,
    hardcodedStrings: hardcoded.slice(0, 500)
  }, null, 2));
  console.log('Report written to translation-audit-report.json');
}

main();
