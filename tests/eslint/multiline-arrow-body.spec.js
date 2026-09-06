import { describe, it } from 'vitest';
import { ESLint, RuleTester } from 'eslint';

import rule from '../../scripts/eslint-rules/multiline-arrow-body.js';

RuleTester.describe = describe;
RuleTester.it = it;

const config = await new ESLint().calculateConfigForFile('src/lib/primitives/field-node.ts');
const tester = new RuleTester({ languageOptions: { parser: config.languageOptions.parser } });

tester.run('project/multiline-arrow-body', rule, {
  valid: [
    'const read = () => value();',
    'items.map(item => item.value);',
    'const read = (\n  value: string,\n) => value;',
    'const read = () => {\n  return value();\n};',
    'const read = () => [\n  first,\n  second,\n];',
    'const read = () => ({\n  first: 1,\n  second: 2,\n});',
    'const read = () => ([\n  first,\n] as const);',
    'const read = () => ({\n  first: 1,\n} satisfies Options);',
    'const read = () => <Options>({\n  first: 1,\n});',
    'computed(() => [\n  first(),\n  second(),\n]);',
    'const read = () => /* note */ value();',
    'const read = () => `one line`;',
  ],
  invalid: [
    'const read = () =>\n  value().first().second();',
    'const read = () => (\n  value()\n);',
    'const read = () => value()\n  .first();',
    'const read = () => call(\n  first, second,\n);',
    'const read = () => first\n  && second;',
    'const read = () => first\n  ? second : third;',
    'const read = () =>\n  value() as Value;',
    'computed(() =>\n  value());',
    'class Example { read = () =>\n  value(); }',
    'const read = async () =>\n  await value();',
    'const read = () => (\n  [first, second].map(transform)\n);',
    'const read = () => // note\n  value();',
    'const read = () => `first\nsecond`;',
    'const read = () => item =>\n  item.value;',
  ].map((code, index, cases) => ({
    code,
    errors: Array.from({ length: index === cases.length - 1 ? 2 : 1 }, () => ({ messageId: 'explicitReturn' })),
  })),
});
