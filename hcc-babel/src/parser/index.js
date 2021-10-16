const acorn = require('acorn')
const syntaxPlugins = {
  'literal': require("./plugins/literal.js"),
}

const defaultOptions = {
  plugins: []
}

function parse(code, options) {
  const resolveOptions = Object.assign({}, defaultOptions, options)
  const newParser = resolveOptions.plugins.reduce((Parser, pluginName) => {
    let plugin = syntaxPlugins[pluginName]
    return plugin ? Parser.extend(plugin) : Parser
  }, acorn.Parser)
  return newParser.parse(code, {
    locations:true,
  })
}


module.exports = {
  parse
}
