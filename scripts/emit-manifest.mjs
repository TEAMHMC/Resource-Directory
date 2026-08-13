/**
 * Emits a public manifest of listings so the Partner Portal can resolve a
 * ?claim=<id> to an authoritative name.
 *
 * The directory's listings are a static import in this repo, not portal data,
 * so the portal has no way to look one up. Passing the name in the claim URL
 * would have worked but is not trustworthy: anyone can edit the query string
 * and make the portal render a claim for one organization against another
 * organization's record. The id is the only thing the link carries; this file
 * is what turns that id back into a name.
 *
 * Only fields needed to confirm "is this you" are published. No internal notes.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

const OUT = 'dist/resources.json';

// constants.ts is TSX, so it is read and parsed rather than imported.
const src = readFileSync('constants.ts', 'utf8');
const start = src.indexOf('ALL_RESOURCES');
if (start === -1) throw new Error('ALL_RESOURCES not found in constants.ts');

// Pair id and name within the same object rather than collecting two
// independent lists, which would silently mis-pair if any entry omitted a field.
const body = src.slice(start);
const items = [];
const objectRe = /\{[^{}]*\}/g;
let m;
while ((m = objectRe.exec(body)) !== null) {
  const chunk = m[0];
  const id = chunk.match(/\bid:\s*["']([^"']+)["']/);
  const name = chunk.match(/\bname:\s*["']((?:[^"'\\]|\\.)*)["']/);
  if (id && name) items.push({ id: id[1], name: name[1].replace(/\\(['"])/g, '$1') });
}

await mkdir('dist', { recursive: true });
await writeFile(
  OUT,
  JSON.stringify({ generated: new Date().toISOString(), count: items.length, resources: items }, null, 2),
  'utf8'
);
console.log(`emitted ${items.length} listings to ${OUT}`);
