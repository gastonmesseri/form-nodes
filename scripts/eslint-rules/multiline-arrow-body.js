export default {
  meta: {
    type: 'layout',
    schema: [],
    messages: {
      explicitReturn: 'Use a block with an explicit return for multiline arrow bodies, except array or object literals.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      ArrowFunctionExpression(node) {
        if (node.body.type === 'BlockStatement') return;

        let expression = node.body;
        while (['TSAsExpression', 'TSTypeAssertion', 'TSSatisfiesExpression', 'TSNonNullExpression'].includes(expression.type)) {
          expression = expression.expression;
        }
        if (expression.type === 'ArrayExpression' || expression.type === 'ObjectExpression') return;

        const arrow = sourceCode.getTokenBefore(node.body, token => token.value === '=>');
        if (arrow.loc.end.line !== node.loc.end.line) {
          context.report({ node, loc: arrow.loc, messageId: 'explicitReturn' });
        }
      },
    };
  },
};
