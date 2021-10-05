const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const types = require('@babel/types')
const template = require('@babel/template')

const sourceCode = `
    console.log(1);
`;
const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['jsx']
});
const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);

/*traverse(ast, {
  CallExpression(path, state) {
    if(targetCalleeName.includes(path.get('callee').toString())) {
      const { line, column } = path.node.loc.start;
      console.log(types.stringLiteral(`filename: (${line}, ${column})`))
      path.node.arguments.unshift(types.stringLiteral(`filename: (${line}, ${column})`))
    }
  }
});*/
traverse(ast, {
  CallExpression(path, state) {
    if (path.node.isNew) {
      return;
    }
    if(targetCalleeName.includes(path.get('callee').toString())) {
      const { line, column } = path.node.loc.start;
      const newNode = template.expression(`console.log("filename: (${line}, ${column})")`)();
      newNode.isNew = true;


      if (path.findParent(path => path.isJSXElement())) {
        console.log(path)
        path.replaceWith(types.arrayExpression([newNode, path.node]))
        path.skip();
      } else {
        path.insertBefore(newNode);
      }

    }
  }
});

const { code, map } = generate(ast);
console.log(code);
