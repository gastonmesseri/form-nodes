import ts from 'typescript';
import { resolve } from 'node:path';
import { mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, '.angular/jsdoc-snippets');
const sourceFiles = [];
function visitDirectory(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) visitDirectory(path);
    else if (entry.name.endsWith('.ts') && !/\.(spec|fixture)\./u.test(entry.name)) sourceFiles.push(path);
  }
}
visitDirectory(resolve(root, 'src'));
sourceFiles.sort();
const publicSource = ts.createSourceFile(
  'public-api.ts',
  readFileSync(resolve(root, 'src/public-api.ts'), 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);
const publicNames = new Set();
for (const statement of publicSource.statements) {
  if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
    for (const element of statement.exportClause.elements) publicNames.add(element.name.text);
  }
}
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
const inventory = [];
const examples = new Map();
const failures = [];
for (const path of sourceFiles) {
  const source = readFileSync(path, 'utf8');
  const declarations = new Map();
  const sourceTree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  function collectDeclarations(node) {
    for (const doc of node.jsDoc ?? []) declarations.set(doc.pos, node.getText(sourceTree).split('\n')[0]);
    ts.forEachChild(node, collectDeclarations);
  }
  collectDeclarations(sourceTree);
  for (const match of source.matchAll(/\/\*\*[\s\S]*?\*\//gu)) {
    const line = source.slice(0, match.index).split('\n').length;
    const body = match[0]
      .split('\n')
      .map(value => value.replace(/^\s*\* ?/u, ''))
      .join('\n');
    const entry = { file: path.slice(root.length + 1), line, declaration: declarations.get(match.index), examples: 0 };
    inventory.push(entry);
    if (/@example\b/u.test(body)) failures.push(`${entry.file}:${line}: Use Markdown fences instead of @example.`);
    const firstParam = body.search(/@param\b/u);
    if (firstParam >= 0 && body.indexOf('```', firstParam) >= 0)
      failures.push(`${entry.file}:${line}: Place examples before @param tags.`);
    for (const block of body.matchAll(/```(?:ts|typescript)\n([\s\S]*?)```/gu)) {
      const code = block[1].trim();
      entry.examples++;
      for (const [offset, value] of code.split('\n').entries()) {
        if (value.length > 45)
          failures.push(`${entry.file}:${line}: Example line ${offset + 1} exceeds 45 characters (${value.length}).`);
      }
      if (!examples.has(code)) examples.set(code, []);
      examples.get(code).push(`${entry.file}:${line}`);
    }
  }
}
if (!inventory.length || !examples.size) failures.push('JSDoc discovery found no comments or TypeScript examples.');
const locations = new Map();
for (const [code, origins] of examples) {
  const syntax = ts.createSourceFile('example.ts', code, ts.ScriptTarget.Latest, true);
  const identifiers = new Set();
  const declared = new Set();
  function collect(node) {
    if (ts.isIdentifier(node)) identifiers.add(node.text);
    ts.forEachChild(node, collect);
  }
  collect(syntax);
  function declare(name) {
    if (ts.isIdentifier(name)) declared.add(name.text);
    else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements) if (ts.isBindingElement(element)) declare(element.name);
    }
  }
  for (const statement of syntax.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) declare(declaration.name);
    } else if (statement.name && ts.isIdentifier(statement.name)) declare(statement.name);
    else if (ts.isImportDeclaration(statement) && statement.importClause) {
      if (statement.importClause.name) declare(statement.importClause.name);
      const bindings = statement.importClause.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) for (const item of bindings.elements) declare(item.name);
      else if (bindings) declare(bindings.name);
    }
  }

  const imports = [...identifiers].filter(name => publicNames.has(name) && !declared.has(name)).sort();
  const path = resolve(output, `example-${locations.size}.ts`);
  const prefix = imports.length ? `import { ${imports.join(', ')} } from '../../src/public-api';\n` : 'export {};\n';
  writeFileSync(path, prefix + code + '\n');
  locations.set(path, origins);
}
writeFileSync(resolve(output, 'source-audit.json'), JSON.stringify(inventory, null, 2) + '\n');
const program = ts.createProgram([...locations.keys()], {
  baseUrl: root,
  paths: { '@ngblocks/form-nodes': ['src/public-api.ts'] },
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  experimentalDecorators: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.Preserve,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
});
const diagnostics = ts.getPreEmitDiagnostics(program);
for (const diagnostic of diagnostics) {
  const origin = diagnostic.file
    ? (locations.get(diagnostic.file.fileName)?.join(', ') ?? diagnostic.file.fileName)
    : 'JSDoc';
  failures.push(`${origin}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
}
writeFileSync(resolve(output, 'failures.json'), JSON.stringify(failures, null, 2) + '\n');
if (failures.length) {
  console.error(failures.slice(0, 30).join('\n'));
  console.error(`${failures.length} JSDoc failures. Full report: .angular/jsdoc-snippets/failures.json`);
  process.exitCode = 1;
} else {
  console.log(
    `JSDoc audit passed: ${inventory.length} comments in ${new Set(inventory.map(entry => entry.file)).size} documented source files; ${examples.size} distinct TypeScript examples compiled.`,
  );
}

// Compile Angular templates as well as TypeScript expressions.
if (!failures.length && locations.size) {
  const { spawnSync } = await import('node:child_process');
  const config = resolve(output, 'tsconfig.json');
  writeFileSync(
    config,
    JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          experimentalDecorators: true,
          target: 'ES2022',
          module: 'preserve',
          moduleResolution: 'bundler',
          baseUrl: root,
          paths: { '@ngblocks/form-nodes': ['src/public-api.ts'] },
        },
        angularCompilerOptions: { strictTemplates: true, strictInjectionParameters: true },
        files: [...locations.keys()],
      },
      null,
      2,
    ),
  );
  const compiler = resolve(root, 'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js');
  const result = spawnSync(process.execPath, [compiler, '-p', config], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(result.stdout, result.stderr);
    process.exitCode = 1;
  } else console.log('JSDoc Angular template compilation passed.');
}

// Execute deterministic output annotations in model-only examples.
if (!process.exitCode && locations.size) {
  const { buildSync } = await import('esbuild');
  const { spawnSync } = await import('node:child_process');
  const runtimeFiles = [];
  let assertions = 0;
  for (const [path, origins] of locations) {
    const source = readFileSync(path, 'utf8');
    const syntax = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
    if (syntax.statements.some(statement => ts.isClassDeclaration(statement))) continue;
    const edits = [];
    for (const statement of syntax.statements) {
      if (!ts.isExpressionStatement(statement)) continue;
      const trailing = source.slice(statement.end).match(/^\s*\/\/\s*(?:=>\s*)?([^\n]+)/u);
      if (!trailing) continue;
      const expected = trailing[1].trim();
      // Only literal data is an output assertion; prose and type previews are not executable.
      if (!/^(?:true|false|null|undefined|-?\d|'|"|\[|\{)/u.test(expected)) continue;
      const literal = ts.createSourceFile(
        'expected.ts',
        `const expected = (${expected});`,
        ts.ScriptTarget.Latest,
        true,
      );
      if (literal.parseDiagnostics.length) continue;
      const expression = statement.expression.getText(syntax);
      const actual =
        ts.isCallExpression(statement.expression) && statement.expression.expression.getText(syntax) === 'console.log'
          ? statement.expression.arguments[0]?.getText(syntax)
          : expression;
      if (!actual) continue;
      edits.push([
        statement.getStart(syntax),
        statement.end,
        `assert.deepStrictEqual(${actual}, (${expected}), ${JSON.stringify(origins.join(', '))});`,
      ]);
    }
    if (!edits.length) continue;
    let transformed = source;
    for (const [start, end, replacement] of edits.reverse())
      transformed = transformed.slice(0, start) + replacement + transformed.slice(end);
    const target = path.replace(/\.ts$/u, '.runtime.ts');
    writeFileSync(target, `import assert from 'node:assert/strict';\n${transformed}`);
    runtimeFiles.push(target);
    assertions += edits.length;
  }
  const entry = resolve(output, 'runtime-entry.ts');
  if (!runtimeFiles.length) throw new Error('JSDoc discovery found no executable output assertions.');
  writeFileSync(
    entry,
    `import '@angular/compiler';\n` +
      runtimeFiles
        .map(path => {
          return `try { await import(${JSON.stringify(path)}); } catch (error) { console.error(error); process.exitCode = 1; }`;
        })
        .join('\n'),
  );
  const bundle = resolve(output, 'runtime.mjs');
  buildSync({
    entryPoints: [entry],
    outfile: bundle,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    logLevel: 'silent',
  });
  const result = spawnSync(process.execPath, [bundle], { encoding: 'utf8', timeout: 60000 });
  if (result.status !== 0) {
    console.error(result.error ?? '', result.stdout, result.stderr);
    process.exitCode = 1;
  } else console.log(`JSDoc runtime verification passed: ${assertions} assertions in ${runtimeFiles.length} examples.`);
}
