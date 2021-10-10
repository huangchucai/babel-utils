const {declare} = require('@babel/helper-plugin-utils')

const base54 = (function(){
  let DIGITS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
  return function(num) {
    let ret = ''
    do {
      ret = DIGITS.charAt(num % 54) + ret;
      num = Math.floor(num / 54);
    } while (num > 0);
    return ret;
  };
})();



const mange = declare((api, options, dirname) => {
  api.assertVersion(7)

  return {
    pre(file) {
      file.set('uid', 0)
    },
    visitor: {

      Scopable: {
        exit(path, state) {
          let uid = state.file.get('uid');
          // 查看作用域下的全部声明
          Object.entries(path.scope.bindings).forEach(([key, binding]) => {
            if(binding.mangled) return;
            binding.mangled = true;
            const newName = path.scope.generateUid(base54(uid++))
            binding.path.scope.rename(key, newName)
          })
          state.file.set('uid', uid);
        }
      }
    }
  }

})

module.exports = mange
