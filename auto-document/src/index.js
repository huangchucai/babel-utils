const { transformFromAstSync } = require('@babel/core')
const parser = require('@babel/parser')
const autoDocument = require('./plugin/auto-document-plugin.js')
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
    [autoDocument, {
      outputDir: path.resolve(__dirname, './docs'),
      format: 'markdown'// html / json
    }]
  ]
})

console.log(code)
