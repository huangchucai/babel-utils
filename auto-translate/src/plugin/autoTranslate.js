const { declare } = require('@babel/helper-plugin-utils')
const generate = require('@babel/generator').default;
const fse = require('fs-extra');
const path = require('path')


let intlIndex = 0;
function nextIntlKey() {
  ++intlIndex;
  return `intl${intlIndex}`;
}


const autoTranslate = declare((api, options) => {
  api.assertVersion(7)

  if (!options.outputDir) {
    throw new Error('outputDir in empty')
  }

  function save(state, key, value) {
    const allText = state.get('allText');
    allText.push({
      key, value
    });
    state.set('allText', allText);
  }

  function getReplaceExpression(path, value, intlUid) {
    const expressionParams = path.isTemplateLiteral() ? path.node.expressions.map(item => generate(item).code) : null
    let replaceExpression = api.template.ast(`${intlUid}.t('${value}'${expressionParams ? ',' + expressionParams.join(',') : ''})`);
    if (path.findParent(p => p.isJSXAttribute()) && !path.findParent(p=> p.isJSXExpressionContainer())) {
      replaceExpression = api.types.JSXExpressionContainer(replaceExpression.expression);
    }
    return replaceExpression;
  }



  return {
    pre(state) {
      state.set('allText', []);
    },
    visitor: {
      Program: {
        enter(path, state) {
          let imported
          path.traverse({
            ImportDeclaration(curPath) {
              const source = curPath.node.source.value
              if (source === 'intl') {
                imported = true
                state.intlUid = curPath.get('specifiers.0').toString()
                curPath.stop()
              }
            },

          })
          if (!imported) {
            const uid = path.scope.generateUid('intl')
            const importAst = api.template.ast(`import ${uid} from 'intl'`)
            path.node.body.unshift(importAst)
            state.intlUid = uid
          }


          path.traverse({
            'StringLiteral|TemplateLiteral'(curPath) {
              const comments = curPath.get('leadingComments')
              if (Array.isArray(comments)) {
                path.node.leadingComments = comments.filter(comment => {
                  if (comment.node.value.includes('i18n-disable')) {
                    curPath.node.skipTransform = true
                    return false
                  }
                  return true
                })
              }

              // 如果父类是import声明，也不需要替换
              if(curPath.findParent(p => p.isImportDeclaration())) {
                curPath.node.skipTransform = true
              }
            }
          })
        }
      },
      StringLiteral(path, state) {
        if (path.node.skipTransform) {
          return
        }
        let key = nextIntlKey()
        save(state.file, key, path.node.value)
        const replaceExpression = getReplaceExpression(path, key, state.intlUid)
        path.replaceWith(replaceExpression);
        path.skip()
      },
      TemplateLiteral(path, state) {
        if (path.node.skipTransform) {
          return;
        }
        const value = path.get('quasis').map(item => item.node.value.raw).join('{placeholder}');
        if(value) {
          let key = nextIntlKey();
          save(state.file, key, value);

          const replaceExpression = getReplaceExpression(path, key, state.intlUid);
          path.replaceWith(replaceExpression);
          path.skip();
        }
      },
    },
    post(file) {
      const allText = file.get('allText');
      const intlData = allText.reduce((obj, item) => {
        obj[item.key] = item.value;
        return obj;
      }, {});

      const content = `const resource = ${JSON.stringify(intlData, null, 4)};\nexport default resource;`;
      fse.ensureDirSync(options.outputDir);
      fse.writeFileSync(path.join(options.outputDir, 'zh_CN.js'), content);
      fse.writeFileSync(path.join(options.outputDir, 'en_US.js'), content);
    }
  }
})

module.exports = autoTranslate
