const astDefinitionsMap = new Map()

astDefinitionsMap.set('Program', {
  visitor: ['body'],
  isBlock: true
})
astDefinitionsMap.set('VariableDeclaration', {
  visitor: ['declarations']
})
astDefinitionsMap.set('VariableDeclarator', {
  visitor: ['id', 'init']
})
astDefinitionsMap.set('Identifier', {})
astDefinitionsMap.set('NumericLiteral', {})
astDefinitionsMap.set('FunctionDeclaration', {
  visitor: ['id', 'params', 'body'],
  isBlock: true
})

astDefinitionsMap.set('BlockStatement', {
  visitor: ['body']
})

astDefinitionsMap.set('MemberExpression', {
  visitor: ['object', 'property']
})
astDefinitionsMap.set('ReturnStatement', {
  visitor: ['argument']
})
astDefinitionsMap.set('ExpressionStatement', {
  visitor: ['expression']
})
astDefinitionsMap.set('CallExpression', {
  visitor: ['callee', 'arguments']
})

const validations = {}

for (let name of astDefinitionsMap.keys()) {
    validations['is' + name] = function(node) {
      return node.type === name;
    }
}

module.exports = {
  visitorKeys: astDefinitionsMap,
  ...validations
}
