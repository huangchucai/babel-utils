const { declare } = require('@babel/helper-plugin-utils')


const autoLintPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)
  return {
    pre(file) {
      file.set('errors', [])
    },
    visitor: {
      ForStatement(path, state) {
        const errors = state.file.get('errors')
        const testOperator = path.node.test.operator
        const updateOperator = path.node.update.operator
        let shouldUpdateOperator
        if (['<', '<='].includes(testOperator)) {
          shouldUpdateOperator = '++'
        } else if (['>', '>='].includes(testOperator)) {
          shouldUpdateOperator = '--'
        }

        if (shouldUpdateOperator !== updateOperator) {
          // throw path.get('update').buildCodeFrameError("for direction error", Error)
          const tmp = Error.stackTraceLimit
          Error.stackTraceLimit = 0
          errors.push(path.get('update').buildCodeFrameError('for direction error', Error))
          Error.stackTraceLimit = tmp
        }
      },
      AssignmentExpression(path, state) {
        const errors = state.file.get('errors')
        const assignTarget = path.get('left').toString()
        const binding = path.scope.getBinding(assignTarget)
        if (binding) {
          if(binding.path.isFunctionDeclaration() || binding.path.isFunctionExpression() ||
              binding.path.get('init').isFunctionExpression()
          ) {
            const tmp = Error.stackTraceLimit
            Error.stackTraceLimit = 0;
            errors.push(path.buildCodeFrameError('can not reassign to function', Error));
            Error.stackTraceLimit = tmp;
          }
        }
      },
      BinaryExpression(path, state) {
        const errors = state.file.get('errors')
        if(['==', '!='].includes(path.node.operator)) {
          const left = path.get('left')
          const right = path.get('right')
          if(!(left.isLiteral() && right.isLiteral() && typeof left.node.value === typeof right.node.value)) {
            const tmp = Error.stackTraceLimit
            Error.stackTraceLimit = 0;
            errors.push(path.buildCodeFrameError(`please replace ${path.node.operator} with ${path.node.operator + '='}`, Error));
            Error.stackTraceLimit = tmp;
            if(state.opts.fix) {
              path.node.operator = path.node.operator + '=';
            }
          }
        }
      },
      FunctionDeclaration(path, state) {
        path.addComment('inner', '@__PURE__', false)
      }
    },
    post(file) {
      console.log(file.get('errors'))
    }
  }
})
module.exports = autoLintPlugin
