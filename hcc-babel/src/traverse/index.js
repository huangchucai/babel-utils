const NodePath = require('./path/nodePath')
const { visitorKeys } = require('../types')


function traverse(node, visitors, parent, parentPath, key, listKey) {
  const definition = visitorKeys.get(node.type)

  let visitorFuncs = visitors[node.type] || {}

  if (typeof visitorFuncs === 'function') {
    visitorFuncs = {
      enter: visitorFuncs,
    }
  }

  // 创建path
  const path = new NodePath(node, parent, parentPath, key, listKey)

  visitorFuncs.enter && visitorFuncs.enter(path)

  if (node.__shouldSkip) {
    delete node.__shouldSkip
    return
  }

  if (definition.visitor) {
    definition.visitor.forEach(key => {
      const props = node[key] // key => body / props => body的属性
      if (Array.isArray(props)) { // 如果该属性是数组
        props.forEach((childNode, index) => {
          traverse(childNode, visitors, node, path, key, index)
        })
      } else {
        traverse(props, visitors, node, path, key)
      }
    })
  }

  visitorFuncs.exit && visitorFuncs.exit(path)
}

module.exports = traverse

