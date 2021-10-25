const { declare } = require('@babel/helper-plugin-utils')
const importTransform = declare((api, options) => {
  api.assertVersion(7)
  return {
    visitor: {
      VariableDeclaration(path, state) {
        // const variableDeclaratorPath = path.get('declarations.0')
        // const init = variableDeclaratorPath.get('init')
        // if (init.isCallExpression() && init.get('callee').toString() === 'require') {
        //   let id = variableDeclaratorPath.get('id').node
        //   let source = init.get('arguments.0').node
        //   const defaultSpecifier = api.types.importDefaultSpecifier(id)
        //   const importNode = api.types.ImportDeclaration([defaultSpecifier], source)
        //   path.replaceWith(importNode)
        // }
      },
      VariableDeclarator(path, state) {
        const init = path.get('init')
        if (init.isCallExpression() && init.get('callee').toString() === 'require') {
          let idPath = path.get('id')
          let source = init.get('arguments.0').node
          if (idPath.isObjectPattern()) {
            let properties = idPath.get('properties')
            let importSpecifiers = []
            properties.forEach(property => {
              const key = property.get('key').node
              importSpecifiers.push(api.types.importSpecifier(key, key))
            })
            const importNode = api.types.importDeclaration(importSpecifiers, source)
            path.parentPath.replaceWith(importNode)

          } else {
            let idNode = idPath.node
            const defaultSpecifier = api.types.importDefaultSpecifier(idNode)
            const importNode = api.types.ImportDeclaration([defaultSpecifier], source)
            path.parentPath.replaceWith(importNode)
          }
        }
      }
    }
  }
})

module.exports = importTransform
