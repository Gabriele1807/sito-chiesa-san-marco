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

function getTranslatorNamespaces(sourceFile) {
  const translatorVars = {};
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      if (ts.isCallExpression(node.initializer)) {
        const call = node.initializer;
        const fnName = call.expression.getText(sourceFile);
        if (['useTranslations', 'getTranslations'].includes(fnName) && call.arguments.length > 0) {
          const arg = call.arguments[0];
          if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
            const namespace = arg.text;
            if (ts.isIdentifier(node.name)) {
              translatorVars[node.name.text] = namespace;
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return translatorVars;
}

function collectTranslationKeys() {
  const files = walk('src', ['.ts', '.tsx']);
  const usedKeys = new Set();
  const usedNamespacedKeys = new Set();
  const namespaceCounts = {};
  const namespaceByFile = {};

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const translatorVars = getTranslatorNamespaces(sourceFile);
    namespaceByFile[file] = translatorVars;
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.arguments.length > 0) {
        const fn = node.expression.text;
        const arg = node.arguments[0];
        if (translatorVars[fn] && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
          const namespacedKey = `${translatorVars[fn]}.${arg.text}`;
          usedNamespacedKeys.add(namespacedKey);
          usedKeys.add(arg.text);
          namespaceCounts[translatorVars[fn]] = (namespaceCounts[translatorVars[fn]] || 0) + 1;
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
  }
  return { usedKeys: Array.from(usedKeys).sort(), usedNamespacedKeys: Array.from(usedNamespacedKeys).sort(), namespaceCounts, namespaceByFile };
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
          entries.push({ file, line: sf.getLineAndCharacterOfPosition(node.pos).line + 1, text, type: 'JSXText' });
        }
      } else if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
        const text = node.initializer.text.trim();
        if (text.length >= 2 && /[A-Za-zÀ-ž٠-٩]/.test(text)) {
          entries.push({ file, line: sf.getLineAndCharacterOfPosition(node.initializer.pos).line + 1, text, type: 'JSXAttribute' });
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sf);
  }
  const grouped = entries.reduce((acc, item) => {
    const key = item.text;
    if (!acc[key]) acc[key] = [];
    acc[key].push(`${item.file}:${item.line}:${item.type}`);
    return acc;
  }, {});
  return Object.entries(grouped).map(([text, locs]) => ({ text, locs })).sort((a,b)=>b.locs.length-a.locs.length);
}

function main() {
  const translations = collectTranslationKeys();
  const it = flatten(JSON.parse(fs.readFileSync('src/messages/it.json', 'utf8')));
  const ar = flatten(JSON.parse(fs.readFileSync('src/messages/ar.json', 'utf8')));
  const missingInIt = translations.usedNamespacedKeys.filter(key => !Object.hasOwn(it, key));
  const missingInAr = translations.usedNamespacedKeys.filter(key => !Object.hasOwn(ar, key));
  const unusedIt = Object.keys(it).filter(key => !translations.usedNamespacedKeys.includes(key));
  const unusedAr = Object.keys(ar).filter(key => !translations.usedNamespacedKeys.includes(key));
  const hardcoded = collectHardcodedStrings().filter(item => !item.text.match(/^\s*$/));

  fs.writeFileSync('translation-audit-report-2.json', JSON.stringify({
    namespaceCounts: translations.namespaceCounts,
    namespaceByFile: translations.namespaceByFile,
    usedKeys: translations.usedKeys,
    usedNamespacedKeys: translations.usedNamespacedKeys,
    missingInIt,
    missingInAr,
    unusedIt,
    unusedAr,
    hardcodedStrings: hardcoded.slice(0, 500)
  }, null, 2));
}

main();
