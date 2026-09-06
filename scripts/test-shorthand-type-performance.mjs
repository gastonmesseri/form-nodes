import { spawnSync } from 'node:child_process';

// Full inline node contexts retain concrete aggregate children and array item APIs.
// This source-based fixture also counts the internal FieldNodeFactory implementation.
const maximumTypes = 88_200;
const maximumInstantiations = 1_100_000;
const result = spawnSync(
  process.execPath,
  [
    './node_modules/typescript/bin/tsc',
    '-p',
    'tests/performance/tsconfig.declaration-shorthand.json',
    '--extendedDiagnostics',
    '--pretty',
    'false',
  ],
  { cwd: process.cwd(), encoding: 'utf8' },
);
const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();

if (result.status !== 0) {
  throw new Error(`Declaration shorthand performance fixture did not compile.\n${output}`);
}

const readMetric = (name) => {
  const match = output.match(new RegExp(`^${name}:\\s+([0-9]+)`, 'm'));
  if (!match) throw new Error(`TypeScript did not report the ${name} metric.\n${output}`);
  return Number(match[1]);
};

const types = readMetric('Types');
const instantiations = readMetric('Instantiations');

if (types > maximumTypes || instantiations > maximumInstantiations) {
  throw new Error(
    `Declaration shorthand type complexity exceeded its budget: ${types.toLocaleString()} types `
    + `(maximum ${maximumTypes.toLocaleString()}), ${instantiations.toLocaleString()} instantiations `
    + `(maximum ${maximumInstantiations.toLocaleString()}).`,
  );
}

console.log(
  `Declaration shorthand type performance passed with ${types.toLocaleString()} types and `
  + `${instantiations.toLocaleString()} instantiations.`,
);
