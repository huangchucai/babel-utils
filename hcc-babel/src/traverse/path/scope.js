class Binding {
  constructor(id, path, scope, kind) {
    this.id = id
    this.path = path
    this.scope = scope
    this.kind = kind
    this.referenced = false
    this.referencePaths = []
  }
}
