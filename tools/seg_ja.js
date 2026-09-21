// Mark Japanese phrase boundaries so lines only break between phrases (文節).
// Every data-ja value with Japanese text gets &#8203; (zero-width space) between
// BudouX phrases; CSS then sets word-break:keep-all for JA so the browser breaks
// only there. Idempotent: existing markers are stripped first.
// Usage: node seg_ja.js <in.html> <out.html>
const fs = require('fs');
const crypto = require('crypto');
const { loadDefaultJapaneseParser } = require('budoux');
const parser = loadDefaultJapaneseParser();
const [src, dst] = process.argv.slice(2);
let s = fs.readFileSync(src, 'utf8');
const ZW = '&#8203;';
const JP = /[぀-ヿ一-鿿]/;
// Hand-tuned phrases: keep 「体験したことを」 together; let the long verb in the
// narrow Process cards break before 「いただきます。」 instead of orphaning 「。」.
const MERGE = [['体験した', 'ことを']];
const SPLIT = c => { const m = c.match(/^(.+て)(いただきます。?)$/); return m ? [m[1], m[2]] : [c]; };
function tune(chunks) {
  const out = [];
  for (const c of chunks) {
    const prev = out[out.length - 1];
    if (MERGE.some(([a, b]) => prev === a && c === b)) { out[out.length - 1] = prev + c; continue; }
    out.push(...SPLIT(c));
  }
  return out;
}
let n = 0;
s = s.replace(/data-ja="([^"]*)"/g, (m, v) => {
  const plain = v.split(ZW).join('');
  if (!JP.test(plain)) return `data-ja="${plain}"`;
  const out = plain.split('\n').map(line => tune(parser.parse(line)).join(ZW)).join('\n');
  if (out !== plain) n++;
  return `data-ja="${out}"`;
});
// CSS: Japanese text blocks break only at the markers (and anywhere as a last resort)
const OLD = 'html[lang="ja"] h1,html[lang="ja"] h2,html[lang="ja"] h3,\nhtml[lang="ja"] p,html[lang="ja"] li,html[lang="ja"] dd,html[lang="ja"] dt{word-break:normal}';
const NEW = '/* JA: break only between phrases (data-ja carries &#8203; between 文節); anywhere = no-overflow safety net */\nhtml[lang="ja"] h1,html[lang="ja"] h2,html[lang="ja"] h3,\nhtml[lang="ja"] p,html[lang="ja"] li,html[lang="ja"] dd,html[lang="ja"] dt{word-break:keep-all;overflow-wrap:anywhere}';
if (s.includes(OLD)) s = s.replace(OLD, NEW);
else if (!s.includes(NEW)) throw new Error('JA word-break rule not found');
fs.writeFileSync(dst, s);
const b = fs.readFileSync(dst);
console.log('segmented', n, 'strings | bytes', b.length, '| md5', crypto.createHash('md5').update(b).digest('hex'));
