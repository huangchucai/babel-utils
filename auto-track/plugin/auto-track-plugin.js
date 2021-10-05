const { declare } = require('@babel/helper-plugin-utils')
const importModule = require('@babel/helper-module-imports')
const { addDefault } = require('@babel/helper-module-imports')


const autoTrackPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)
  return {
    visitor: {
      Program: {
        enter(path, state) {
          path.traverse({
            ImportDeclaration(curPath) {
              // 找到是否已经引入过track
              const requirePath = curPath.get('source').node.value
              if (requirePath === options.trackerPath) {
                // 如果已经引入过track, 就获取引入的值（分几种情况引入）
                // 1. ImportDefaultSpecifier 2. ImportNamespaceSpecifier 3. ImportSpecifier 4. 空
                const specifierArrPath = curPath.get('specifiers')
                if (Array.isArray(specifierArrPath)) {
                  // 找到track对应的节点
                  specifierArrPath.map(specifierPath => {
                    if (specifierPath.isImportNamespaceSpecifier()) {
                      state.trackerImportId = specifierPath.get('local').toString()
                    } else if (specifierPath.isImportDefaultSpecifier() || specifierPath.isImportSpecifier()) {
                      state.trackerImportId = specifierPath.toString()
                    }
                  })
                  state.trackerAST = api.template.statement(`${state.trackerImportId}()`)()
                }
                curPath.stop()
              }

            }
          })
          // 如果trackerImportId不存在的话，就证明没有引入过，需要创建
          if (!state.trackerImportId) {
            state.trackerImportId = addDefault(path, options.trackerPath, {
              nameHint: path.scope.generateUid(options.trackerPath)
            }).name
            state.trackerAST = api.template.statement(`${state.trackerImportId}()`)()
          }
        }
      },
      'FunctionDeclaration|ClassMethod|ArrowFunctionExpression|FunctionExpression'(path, state) {
        const bodyPath = path.get('body')
        if (bodyPath.isBlockStatement()) {
          bodyPath.node.body.unshift(state.trackerAST)
        } else {
          const ast = api.template.statement(`{${state.trackerImportId}();return PREV_BODY;}`)({PREV_BODY: bodyPath.node})
          bodyPath.replaceWith(ast);
        }
      }
    }
  }
})
module.exports = autoTrackPlugin
