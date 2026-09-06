import { resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

const readmePath = resolve(import.meta.dirname, '../../README.md');
const examplesDirectory = resolve(import.meta.dirname, '../examples');
const original = readFileSync(readmePath, 'utf8');
const pattern = /<!-- example: ([\w.-]+)(?:#([\w-]+))? -->\n```ts\n[\s\S]*?```\n<!-- \/example -->/g;
let count = 0;

const updated = original.replace(pattern, (_block, file, region) => {
  const source = readFileSync(resolve(examplesDirectory, file), 'utf8');
  const snippet = region
    ? source.match(new RegExp(`// #region ${region}\\n([\\s\\S]*?)// #endregion ${region}`))?.[1]
    : source;
  if (!snippet) throw new Error(`README example not found: ${file}${region ? `#${region}` : ''}`);
  count += 1;
  return `<!-- example: ${file}${region ? `#${region}` : ''} -->\n\`\`\`ts\n${snippet.trimEnd()}\n\`\`\`\n<!-- /example -->`;
});

if (count === 0) throw new Error('No canonical README examples were found.');
if (updated !== original) {
  if (!process.argv.includes('--write')) {
    throw new Error('README examples are out of date. Run node website/scripts/sync-readme-examples.mjs --write.');
  }
  writeFileSync(readmePath, updated);
}

console.log(`README examples synchronized with ${count} checked source blocks.`);
