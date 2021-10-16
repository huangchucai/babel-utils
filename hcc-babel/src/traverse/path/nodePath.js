const types = require('../../types')

class NodePath {
  constructor(node, parent, parentPath, key, listKey) {
    this.node = node
    this.parent = parent
    this.parentPath = parentPath
    this.key = key
    this.listKey = listKey

    Object.keys(types).forEach(key => {
      if(key.startsWith('is')) {
        this[key] = types[key].bind(this, node)
      }
    })
  }

  replaceWith(node) {
    if (this.listKey) {
      this.parent[this.key].splice(this.listKey, 1, node)
    } else {
      this.parent[this.key] = node
    }
  }

  remove() {
    if (this.listKey) {
      this.parent[this.key].splice(this.listKey, 1)
    } else {
      this.parent[this.key] = null
    }
  }

  // 顺着path链 向上寻找，不包含当前节点
  findParent(callback) {
    let curPath = this.parentPath
    while (curPath && !callback(curPath)) {
      curPath = curPath.parentPath
    }
    return curPath
  }

  // 顺着path链 向上寻找，包含当前节点
  find(callback) {
    let curPath = this
    while (curPath && !callback(curPath)) {
      curPath = this.parentPath
    }
    return curPath
  }

  traverse(visitors) {
    const traverse = require('../index')
    const definition = types.visitorKeys.get(this.node.type)

    if (definition.visitor) {
      definition.visitor.forEach(key => {
        const prop = this.node[key]
        if (Array.isArray(prop)) {
          prop.forEach((childNode, index) => {
            traverse(childNode, visitors, this.node, this, key ,index)
          })
        } else {
          traverse(prop, visitors, this.node, this, key)
        }
      })
    }
  }

  skip() {
    this.node.__shouldSkip = true
  }

  toString() {
    // return generate(this.node).code
  }
}

module.exports = NodePath

