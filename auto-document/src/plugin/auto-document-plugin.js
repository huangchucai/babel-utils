const { declare } = require('@babel/helper-plugin-utils')
const doctrine = require('doctrine')
const renderer = require('../renderer');
const fse = require('fs-extra')
const path = require('path')


function parseComment(commentStr) {
  if (!commentStr) {
    return
  }
  const parseResult = doctrine.parse(commentStr, {
    unwrap: true
  })
  return parseResult
}

function generate(docs, format = 'json') {
  if (format === 'markdown') {
    return {
      ext: '.md',
      content: renderer.markdown(docs)
    }
  } else if (format === 'html') {
    return {
      ext: 'html',
      content: renderer.html(docs)
    }
  } else {
    return {
      ext: 'json',
      content: renderer.json(docs)
    }
  }
}

function resolveType(tsType) {
  const typeAnnotation = tsType.typeAnnotation
  if (!typeAnnotation) {
    return
  }
  switch (typeAnnotation.type) {
    case 'TSStringKeyword':
      return 'string'
    case 'TSNumberKeyword':
      return 'number'
    case 'TSBooleanKeyword':
      return 'boolean'
  }
}


const autoDocumentPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)
  return {
    pre(state) {
      state.set('docs', [])
    },
    visitor: {
      FunctionDeclaration(path, state) {
        const docs = state.file.get('docs')
        docs.push({
          type: 'function',
          name: path.get('id').toString(),
          params: path.get('params').map(paramPath => {
            return {
              name: paramPath.toString(),
              type: resolveType(paramPath.getTypeAnnotation())
            }
          }),
          return: resolveType(path.get('returnType').getTypeAnnotation()),
          doc: path.node.leadingComments && parseComment(path.node.leadingComments[0].value)
        })
        state.file.set('docs', docs)
      },
      ClassDeclaration(path, state) {
        const docs = state.file.get('docs')
        const classInfo = {
          type: 'class',
          name: path.get('id').toString(),
          constructorInfo: {},
          methodsInfo: [],
          propertiesInfo: []
        }
        // 如果有备注
        if (path.node.leadingComments) {
          classInfo.doc = parseComment(path.node.leadingComments[0].value)
        }
        docs.push(classInfo)
        state.file.set('docs', docs)

        // 遍历类属性和方法
        path.traverse({
          ClassProperty(curPath) {
            classInfo.propertiesInfo.push({
              name: curPath.get('key').toString(),
              type: resolveType(curPath.getTypeAnnotation()),
              doc: [curPath.node.leadingComments, curPath.node.trailingComments].filter(Boolean).map(comment => {
                return parseComment(comment.value)
              }).filter(Boolean)
            })
          },
          ClassMethod(curPath) {
            if (curPath.node.kind === 'constructor') {
              classInfo.constructorInfo = {
                params: curPath.get('params').map(paramPath => {
                  return {
                    name: paramPath.toString(),
                    type: resolveType(paramPath.getTypeAnnotation()),
                    doc: parseComment(path.node.leadingComments[0].value)
                  }
                })
              }
            } else {
              classInfo.methodsInfo.push({
                name: curPath.get('key').toString(),
                doc: parseComment(curPath.node.leadingComments[0].value),
                params: curPath.get('params').map(paramPath => {
                  return {
                    name: paramPath.toString(),
                    type: resolveType(paramPath.getTypeAnnotation())
                  }
                }),
                return: resolveType(curPath.getTypeAnnotation())
              })
            }
          }
        })
      }
    },
    post(state) {
      const docs = state.get('docs')
      const res = generate(docs, options.format)
      fse.ensureDirSync(options.outputDir)
      fse.writeFileSync(path.join(options.outputDir, 'docs'+res.ext), res.content)
      console.log(docs)
    }
  }
})
module.exports = autoDocumentPlugin
