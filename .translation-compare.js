const fs = require('fs');
const path = require('path');
function flatten(obj, prefix='') {
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
const it = flatten(JSON.parse(fs.readFileSync('src/messages/it.json','utf8')));
const ar = flatten(JSON.parse(fs.readFileSync('src/messages/ar.json','utf8')));
const itKeys = Object.keys(it).sort();
const arKeys = Object.keys(ar).sort();
const missingInAr = itKeys.filter(k => !arKeys.includes(k));
const missingInIt = arKeys.filter(k => !itKeys.includes(k));
console.log('itKeys', itKeys.length);
console.log('arKeys', arKeys.length);
console.log('missingInAr', missingInAr.length);
missingInAr.forEach((k,idx)=>{ if(idx<200) console.log('  '+k);});
console.log('missingInIt', missingInIt.length);
missingInIt.forEach((k,idx)=>{ if(idx<200) console.log('  '+k);});
