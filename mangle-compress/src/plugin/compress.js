const { declare } = require('@babel/helper-plugin-utils')

function canExitAfterCompletion(path) {
  return path.isFunctionDeclaration() || path.isVariableDeclaration({
    kind: 'var'
  })
}

const compress = declare((api, options) => {
  return {
    visitor: {
      BlockStatement(path) {
        const statementPaths = path.get('body')
        let purge = false
        for (let i = 0; i < statementPaths.length; i++) {
          if (statementPaths[i].isCompletionStatement()) {
            purge = true
            continue
          }
          if (purge && !canExitAfterCompletion(statementPaths[i])) {
            statementPaths[i].remove()
          }
        }
      },
      // 找到没有使用的变量
      Scopable(path, state) {
        // 找到作用域下面的变量，查看是否有引用
        Object.entries(path.scope.bindings).forEach(([key, binding]) => {
          if (!binding.referenced) {
            // 如果没有引用，查看初始化的是否是函数
            if (binding.path.get('init').isCallExpression()) {
              // 是函数，查看是否有节点前的注释
              const comments = binding.path.get('init').node.leadingComments
              if (comments && comments[0]) {
                if (comments[0].value.includes('PURE')) {
                  binding.path.remove()
                  return
                }
              }
            }
            // 如果函数可能有副作用，就直接执行函数
            if(!path.scope.isPure(binding.path.node.init)) {
              binding.path.parentPath.replaceWith(api.types.expressionStatement(binding.path.node.init))
            } else {
              binding.path.remove()
            }
          }
        })
      }
    }
  }
})

module.exports = compress
