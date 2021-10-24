const { declare } = require('@babel/helper-plugin-utils')
const importTransform = declare((api, options) => {
  api.assertVersion(7)
  return {
    visitor: {
      ImportDeclaration(path, state) {
        const specifiersPath = path.get('specifiers').filter(_ => _.isImportDefaultSpecifier())
        if (Array.isArray(specifiersPath)) {
          specifiersPath.forEach(specifierPath => {
            const specifierNode = specifierPath.node
            const importId = specifierNode.local.name  // 'path'
            const binding = path.scope.getBinding(importId) // 获取path的引用信息

            const referedIds = []
            const transformedIds = []; //转换之后的内容


            binding.referencePaths.forEach(referencePath => {
              const currentPath = referencePath.parentPath
              const methodName = currentPath.node.property.name

              // 获取之前的方法名
              referedIds.push(currentPath.node.property)

              if (!currentPath.scope.getBinding(methodName)) {
                const methodNameNode = currentPath.node.property
                currentPath.replaceWith(methodNameNode)

                transformedIds.push(methodNameNode); // 转换后的方法名

              } else {
                const newMethodName = referencePath.scope.generateUidIdentifier(methodName);
                currentPath.replaceWith(newMethodName);

                transformedIds.push(newMethodName);
              }
            })

            // 转换 import 语句为 named import
            const newSpecifiers = referedIds.map((id, index) => api.types.ImportSpecifier(transformedIds[index], id));
            path.node.specifiers = newSpecifiers;
          })
        }
      }
    }
  }
})

module.exports = importTransform
