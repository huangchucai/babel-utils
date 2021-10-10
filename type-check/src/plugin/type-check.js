const { declare } = require('@babel/helper-plugin-utils')
const { codeFrameColumns } = require('@babel/code-frame')

function noStackTraceWrapper(cb) {
  const tmp = Error.stackTraceLimit
  Error.stackTraceLimit = 0
  cb && cb(Error)
  Error.stackTraceLimit = tmp
}

function typeEval(node, params) {
  let checkType;
  if(node.checkType.type === 'TSTypeReference') {
    checkType = params[node.checkType.typeName.name];
  } else {
    checkType = resolveType(node.checkType);
  }
  const extendsType = resolveType(node.extendsType);
  if (checkType === extendsType || checkType instanceof extendsType) {
    return resolveType(node.trueType);
  } else {
    return resolveType(node.falseType);
  }
}

function resolveType(targetType, referenceTypesMap = {},scope) {
  const tsTypeAnnotationMap = {
    'TSStringKeyword': 'string',
    'TSNumberKeyword': 'number'
  }
  switch (targetType.type) {
    case 'TSTypeAnnotation':
      if (targetType.typeAnnotation.type === 'TSTypeReference' && Object.keys(referenceTypesMap).length) {
        return referenceTypesMap[targetType.typeAnnotation.typeName.name]
      }
      return tsTypeAnnotationMap[targetType.typeAnnotation.type]
    case 'NumberTypeAnnotation':
      return 'number'
    case 'StringTypeAnnotation':
      return 'string'
    case 'TSNumberKeyword':
      return 'number';
    case 'TSStringKeyword':
      return 'string'
    case 'TSTypeReference':
      const typeAlias = scope.getData(targetType.typeName.name) //Res
      const paramTypes = targetType.typeParameters.params.map(item => {
        return resolveType(item)
      }) // [1]
      const params = typeAlias.paramNames.reduce((obj, name, index) => {
        obj[name] = paramTypes[index];
        return obj;
      },{}) // { Param: 1 }
      return typeEval(typeAlias.body, params);
    case 'TSLiteralType':
      return targetType.literal.value
  }
}

const autoTrackPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)
  return {
    pre(file) {
      file.set('errors', [])
    },
    visitor: {
      TSTypeAliasDeclaration(path, state) {
        path.scope.setData(path.get('id').toString(), {
          paramNames: path.node.typeParameters.params.map(item => {
            return item.name
          }),
          body: path.getTypeAnnotation()
        })
      },
      AssignmentExpression(path, state) {
        const errors = state.file.get('errors')
        const rightType = resolveType(path.get('right').getTypeAnnotation())
        const leftBinding = path.scope.getBinding(path.get('left'))
        const leftType = resolveType(leftBinding.path.get('id').getTypeAnnotation())
        if (leftType !== rightType) {
          // console.error(codeFrameColumns(state.file.code, path.node.loc))
          noStackTraceWrapper(Error => {
            errors.push(path.get('right').buildCodeFrameError(`${rightType} can not assign to ${leftType}`, Error))
          })
        }
      },
      CallExpression(path, state) {
        const errors = state.file.get('errors')
        // 得到泛型的类型
        const realTypes = path.node.typeParameters && path.node.typeParameters.params.map(item => {
          return resolveType(item, {}, path.scope)
        })
        // 得到实参的类型
        const argumentsType = path.get('arguments').map(arg => {
          return resolveType(arg.getTypeAnnotation())
        })

        const funcPath = path.scope.getBinding(path.get('callee')).path
        let realTypeMap = null
        if (funcPath.node.typeParameters) {
          realTypeMap = {}
          funcPath.node.typeParameters.params.map((item, index) => {
            realTypeMap[item.name] = realTypes[index]
          })
        }

        // 获取形参的类型
        const paramsType = funcPath.get('params').map(param => {
          return resolveType(param.getTypeAnnotation(), realTypeMap)
        })
        // 对比参数类型和调用的类型是否一致
        argumentsType.forEach((arg, index) => {
          if (arg !== paramsType[index]) {
            noStackTraceWrapper(Error => {
              errors.push(path.get(`arguments.` + index).buildCodeFrameError(`${arg} cat not assign to ${paramsType[index]}`, Error))
            })
          }
        })
      }
    },
    post(file) {
      console.log(file.get('errors'))
    }
  }
})
module.exports = autoTrackPlugin
