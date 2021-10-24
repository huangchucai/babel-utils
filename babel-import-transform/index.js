const { transformFileSync } = require('@babel/core')
const path = require('path')
const importTransformPlugin = require('./plugins/importTransformPlugin')

const { code } = transformFileSync(path.join(__dirname, './sourceCode.js'), {
  plugins: [[importTransformPlugin]]
})

console.log(code)
