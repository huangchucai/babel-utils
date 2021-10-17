const types = require('../../types')
const Scope = require('./scope')

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

  get scope() {
    if(this.__scope) {
      return this.__scope
    }
    const isBlock = this.isBlock()
    const parentScope = this.parentPath && this.parentPath.scope
    return this.__scope = isBlock ? new Scope(parentScope, this) : parentScope
  }

  replaceWith(node) {
    if (this.listKey !== undefined) {
      this.parent[this.key].splice(this.listKey, 1, node)
    } else {
      this.parent[this.key] = node
    }
  }

  remove() {
    if (this.listKey !== undefined)  {
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
        const props = this.node[key]
        if (Array.isArray(props)) {
          props.forEach((childNode, index) => {
            traverse(childNode, visitors, this.node, this, key ,index)
          })
        } else {
          traverse(props, visitors, this.node, this, key)
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
  isBlock() {
    return types.visitorKeys.get(this.node.type).isBlock
  }
}

module.exports = NodePath

