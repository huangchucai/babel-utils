#!/usr/bin/env node
const commander = require('commander');
const { cosmiconfigSync } = require('cosmiconfig');
const glob = require('glob');
const myBabel = require('../hcc-babel/src/core');
const fsPromises = require('fs').promises;
const path = require('path');


commander.option('--out-dir <outDir>', '输出目录')
commander.option('--watch', '监听文件的变动')
commander.parse(process.argv)

const cliOpts = commander.opts()
// console.log(cliOpts.outDir)
// console.log(cliOpts.watch)
// console.log(commander.args)

if (!commander.args[0]) {
  console.error('没有指定待编译文件')
  commander.outputHelp()
  process.exit(1)
}


if (!cliOpts.outDir) {
  console.error('没有指定输出目录')
  commander.outputHelp()
  process.exit(1)
}
const filenames = glob.sync(commander.args[0])
const explorerSync = cosmiconfigSync('myBabel')
const searchResult = explorerSync.search()
console.log('searchResult', searchResult)
const options = {
  babelOptions: searchResult.config,
  cliOpts: {
    ...cliOpts,
    filenames
  }
}

function compile(fileNames) {
  fileNames.forEach(async filename => {
    const fileContent = await fsPromises.readFile(filename, 'utf-8');
    const baseFileName = path.basename(filename);
    const sourceMapFileName = baseFileName + '.map.json';

    const res = myBabel.transformSync(fileContent, {
      ...options.babelOptions,
      fileName: baseFileName
    });
    console.log(res)
    // const generatedFile = res.code + '\n' + '//# sourceMappingURL=' + sourceMapFileName;

    const distFilePath = path.join(options.cliOpts.outDir, baseFileName);
    const distSourceMapPath = path.join(options.cliOpts.outDir, baseFileName + '.map.json');

    try {
      await fsPromises.access(options.cliOpts.outDir);
    } catch(e) {
      await fsPromises.mkdir(options.cliOpts.outDir);
    }
    await fsPromises.writeFile(distFilePath, generatedFile);
    await fsPromises.writeFile(distSourceMapPath, res.map);
  })
}
compile(options.cliOpts.filenames);
