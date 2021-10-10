const { transformFromAstSync } = require('@babel/core')
const parser = require('@babel/parser')
const mangle = require('./plugin/mangle.js')
const compress = require('./plugin/compress.js')
const fs = require('fs')
const path = require('path')

const sourceCode = fs.readFileSync(path.join(__dirname, './sourceCode.ts'), {
  encoding: 'utf-8'
})

const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['typescript']
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    [mangle],
    [compress]
  ]
})

console.log(code)
