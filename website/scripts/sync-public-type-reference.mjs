import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from '../../node_modules/typescript/lib/typescript.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const destination = path.join(root, 'website/docs/reference/types');
const catalog = JSON.parse(fs.readFileSync(new URL('./public-type-reference.json', import.meta.url), 'utf8'));
const config = ts.readConfigFile(path.join(root, 'tsconfig.lib.json'), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram([path.join(root, 'src/public-api.ts')], parsed.options);
const checker = program.getTypeChecker();
const source = program.getSourceFile(path.join(root, 'src/public-api.ts'));
const printer = ts.createPrinter({ removeComments: true });
const check = process.argv.includes('--check');
const slug = name => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const clean = value => value.replace(/\{@link ([^}]+)\}/g, '`$1`').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const code = value => value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = value => clean(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const entries = checker.getExportsOfModule(checker.getSymbolAtLocation(source)).flatMap((exported) => {
  const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
  const declaration = symbol.declarations?.find(node => ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node));
  if (!declaration) return [];
  const metadata = catalog.types[exported.name];
  if (!metadata) throw new Error(`Missing public type documentation metadata: ${exported.name}`);
  return [{ name: exported.name, declaration, symbol, ...metadata }];
}).sort((a, b) => a.name.localeCompare(b.name));
const names = new Set(entries.map(entry => entry.name));
for (const name of Object.keys(catalog.types)) {
  if (!names.has(name)) throw new Error(`Obsolete public type documentation metadata: ${name}`);
}
const expected = new Map();
for (const entry of entries) {
  const { name, declaration, symbol } = entry;
  const family = catalog.families[entry.family];
  const docs = ts.displayPartsToString(symbol.getDocumentationComment(checker));
  const description = entry.description || docs.split('\n\n')[0].replace(/\n/g, ' ');
  if (!description) throw new Error(`Missing description for ${name}`);
  const signature = printer.printNode(ts.EmitHint.Unspecified, declaration, declaration.getSourceFile()).replace(/^export /, '');
  let text = `---\ntitle: ${name}\n---\n\n# ${name}\n\n${clean(description)}\n\n## Import\n\n\`\`\`ts\nimport type { ${name} } from '@ngblocks/form-nodes';\n\`\`\`\n\n## When to use it\n\n${entry.usage}\n\n## Declaration\n\n\`\`\`ts\n${signature}\n\`\`\`\n`;
  if (declaration.typeParameters?.length) {
    text += '\n## Type parameters\n\n| Parameter | Constraint | Default |\n| --- | --- | --- |\n';
    for (const param of declaration.typeParameters) {
      text += `| \`${param.name.text}\` | ${param.constraint ? '`' + code(param.constraint.getText()) + '`' : 'Unconstrained'} | ${param.default ? '`' + code(param.default.getText()) + '`' : 'Required'} |\n`;
    }
  }
  const members = [];
  const visit = (node) => {
    if (ts.isInterfaceDeclaration(node) || ts.isTypeLiteralNode(node)) members.push(...node.members);
    else if (ts.isTypeAliasDeclaration(node)) visit(node.type);
    else if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) node.types.forEach(visit);
    else if (ts.isParenthesizedTypeNode(node)) visit(node.type);
  };
  visit(declaration);
  const descriptions = new Map();
  for (const member of members) {
    if (!member.name) continue;
    const memberSymbol = checker.getSymbolAtLocation(member.name);
    const description = memberSymbol && ts.displayPartsToString(memberSymbol.getDocumentationComment(checker)).split('\n\n')[0];
    if (description) descriptions.set(member.name.getText(), description);
  }
  if (descriptions.size) {
    text += '\n## Declared members\n\nThe declaration above also includes inherited contracts and overloads where applicable.\n\n| Member | Meaning |\n| --- | --- |\n';
    for (const [member, description] of descriptions) text += `| \`${table(member)}\` | ${table(description)} |\n`;
  }
  const references = entries.filter(other => other.name !== name && new RegExp(`\\b${other.name}\\b`).test(signature));
  text += '\n## Related reference\n\n';
  text += `- [${family.contextTitle}](${family.context})\n- [Public types index](./index.md)\n`;
  for (const other of references) text += `- [${other.name}](./${slug(other.name)}.md)\n`;
  expected.set(`${slug(name)}.md`, text);
}
let index = '---\ntitle: Public types\n---\n\n# Public types\n\nEvery consumer-facing type alias and interface exported by `@ngblocks/form-nodes` has a dedicated\nreference below. Prefer inference for node declarations; use these types for component inputs,\nreusable helpers, validator contracts, and integration boundaries.\n\nImport types from the package root. Declarations show their exact generic defaults and constraints;\nhelper names appearing inside a declaration are not necessarily public imports. Follow the linked\npublic types and the associated API guide for practical usage. Types do not create runtime objects.\n`FormNodeDirective` also has a runtime Angular import documented on the binding reference.\n`FormNodesModule` is documented as an Angular module; `_FormNode` is an AOT implementation export,\nnot a consumer type to import.\n\nStart with [custom control contracts](../custom-control-contracts.md) or\n[validation error types](../validation-errors.md) when integrating components or error displays.\n';
const sidebar = [];
for (const [key, family] of Object.entries(catalog.families)) {
  const group = entries.filter(entry => entry.family === key);
  index += `\n## ${family.title}\n\n| Type | Purpose |\n| --- | --- |\n`;
  for (const entry of group) {
    const description = entry.description || ts.displayPartsToString(entry.symbol.getDocumentationComment(checker)).split('\n\n')[0];
    index += `| [${entry.name}](./${slug(entry.name)}.md) | ${table(description)} |\n`;
  }
  sidebar.push({ type: 'category', label: family.title, items: group.map(entry => `reference/types/${slug(entry.name)}`) });
}
expected.set('index.md', index);
fs.mkdirSync(destination, { recursive: true });
const sync = (file, content) => {
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) throw new Error(`Public type reference is out of date: ${path.relative(root, file)}. Run npm --workspace website run types:sync.`);
  } else fs.writeFileSync(file, content);
};
for (const [file, content] of expected) sync(path.join(destination, file), content);
for (const file of fs.readdirSync(destination)) {
  if (file.endsWith('.md') && !expected.has(file)) throw new Error(`Unmapped public type reference page: ${file}`);
}
sync(path.join(root, 'website/public-types-sidebar.ts'), `// Generated by scripts/sync-public-type-reference.mjs.\nimport type { SidebarsConfig } from '@docusaurus/plugin-content-docs';\n\nconst publicTypesSidebar: SidebarsConfig[string] = ${JSON.stringify(sidebar, null, 2)};\n\nexport default publicTypesSidebar;\n`);
console.log(`Public type reference ${check ? 'checked' : 'generated'} for ${entries.length} exported types.`);
