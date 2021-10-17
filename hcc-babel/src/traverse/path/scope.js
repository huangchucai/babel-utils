class Binding {
  constructor(id, path) {
    this.id = id
    this.path = path
    this.referenced = false
    // 对该声明的引用（reference）
    this.referencePaths = []
  }
}

class Scope {
  constructor(parentScope, path) {
    this.parent = parentScope
    this.bindings = {}
    this.path = path

    // 创建的时候绑定所有作用域的声明
    path.traverse({
      VariableDeclarator: (childPath) => {
        this.registerBinding(childPath.node.id.name, childPath)
      },
      FunctionDeclaration: (childPath) => {
        childPath.skip()
        this.registerBinding(childPath.node.id.name, childPath)
      }
    })


    // 找到是否有引用，不包含声明定义的位置
    path.traverse({
      Identifier: (childPath) => {
        if(!childPath.findParent(p => p.isVariableDeclarator() || p.isFunctionDeclaration())) {
          const id = childPath.node.name
          const binding = this.getBinding(id)
          if(binding) { // 如果已经声明过
            binding.referenced = true
            binding.referencePaths.push(childPath)
          }
        }
      }
    })
  }
  // 记录着每一个声明（binding）
  registerBinding(id, path) {
    this.bindings[id] = new Binding(id, path)
  }

  getOwnBinding(id) {
    return this.bindings[id]
  }

  getBinding(id) {
    let res = this.getOwnBinding(id)
    if (res === undefined && this.parent) {
      res = this.parent.getOwnBinding(id)
    }
    return res
  }

  hasBinding(id) {
    return !!this.getBinding(id)
  }
}


module.exports = Scope
