const fs = require('fs-extra')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { moduleResolver } = require('./utils')

class DependencyNode {
  constructor(path = '', imports = {}, exports = []) {
    this.path = path
    this.imports = imports
    this.exports = exports
    this.subModules = {}
  }
}

const IMPORT_TYPE = {
  deconstruct: 'deconstruct',
  default: 'default',
  namespace: 'namespace'
}

const EXPORT_TYPE = {
  all: 'all',
  default: 'default',
  named: 'named'
}



function traverseModule(curModulePath) {
  const dependencyGraph = {
    root: new DependencyNode(),
    allModules: {}
  }
  traverseJsModule(curModulePath, dependencyGraph.root, dependencyGraph.allModules)
  return dependencyGraph
}

function resolveBabelSyntaxPlugins(modulePath) {
  const plugins = []
  if (['.tsx', 'jts'].some(ext => modulePath.endsWith(ext))) {
    plugins.push('jsx')
  }
  if (['ts', 'tsx'].some(ext => modulePath.endsWith(ext))) {
    plugins.push('typescript')
  }
  return plugins
}

function traverseJsModule(curModulePath, dependencyGraphNode, allModules) {
  const moduleFileContent = fs.readFileSync(curModulePath, {
    encoding: 'utf-8'
  })

  dependencyGraphNode.path = curModulePath

  const ast = parser.parse(moduleFileContent, {
    sourceType: 'unambiguous',
    plugins: resolveBabelSyntaxPlugins(curModulePath)
  })

  traverse(ast, {
    ImportDeclaration(path) {
      const subModulePath = moduleResolver(curModulePath, path.get('source.value').node)
      if (!subModulePath) return

      const specifierPaths = path.get('specifiers')
      dependencyGraphNode.imports[subModulePath] = specifierPaths.map(specifierPath => {
        if (specifierPath.isImportSpecifier()) {
          return {
            type: IMPORT_TYPE.deconstruct,
            imported: specifierPath.get('imported').node.name,
            local: specifierPath.get('local').node.name
          }
        } else if (specifierPath.isImportDefaultSpecifier()) {
          return {
            type: IMPORT_TYPE.default,
            local: specifierPath.get('local').node.name
          }
        } else {
          return {
            type: IMPORT_TYPE.namespace,
            local: specifierPath.get('local').node.name
          }
        }
      })

      const subModule = new DependencyNode()
      traverseJsModule(subModulePath, subModule, allModules)
      dependencyGraphNode.subModules[subModule.path] = subModule
    },
    ExportDeclaration(path) {
      // 收集 export信息
      if(path.isExportNamedDeclaration()) {
        const specifiers = path.get('specifiers')
        dependencyGraphNode.exports = specifiers.map(specifierPath => ({
          type: EXPORT_TYPE.named,
          exported: specifierPath.get('exported').node.name,
          local: specifierPath.get('local').node.name
        }))
      } else if(path.isExportDefaultDeclaration()) {
        let exportName
        const declarationPath = path.get('declaration')
        if(declarationPath.isAssignmentExpression()) {
          exportName = declarationPath.get('left').toString()
        } else {
          exportName = declarationPath.toString()
        }
        dependencyGraphNode.exports.push({
          type: EXPORT_TYPE.default,
          exported: exportName
        })
      } else {
        dependencyGraphNode.exports.push({
          type: EXPORT_TYPE.all,
          exported: path.get('exported').node.name,
          source: path.get('source').node.value
        })
      }
    }
  })
  // 收集import 信息
  // 递归处理依赖模块
  allModules[curModulePath] = dependencyGraphNode
}




module.exports = traverseModule
