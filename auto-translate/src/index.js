const { transformFromAstSync } = require('@babel/core')
const parser = require("@babel/parser")
const fs = require('fs')
const path = require('path')
const autoTranslate = require('./plugin/autoTranslate')

const sourceCode = fs.readFileSync(path.join(__dirname, './sourceCode.js'), {
  encoding: 'utf-8'
})

const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['jsx']
})

const {code} = transformFromAstSync(ast, sourceCode, {
  plugins: [
      [autoTranslate, {
        outputDir: path.resolve(__dirname, './output')
      }]
  ]
})


console.log(code);
