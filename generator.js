const fs = require('fs');
const csv = require('csv-parser');
const program = require('commander');

const {
  convertNodeIntoJson,
  extractKeys,
  recursiveNode,
  replaceValuesByKeys,
  saveFile,
  saveJsonFile,
  sanitizeResults,
  printError
} = require('./common.js');

const {
  validate
} = require('./validation');


const generateKeys = (templateFileUri, mapFileName) => {
  /** validation */
  const v1 = validate('mapFileName', mapFileName);
  const v2 = validate('jsonFileName', templateFileUri);
  if(v1 && v2) {
    fs.readFile(`${templateFileUri}`, (err, template) => {
      const nodeList = recursiveNode('', '', JSON.parse(template.toString()));
      const keys = extractKeys(nodeList);
  
      str = '';
      for(let path of keys ) {
        str += path.key +'\t' + path.value + '\n';
      }
    
      saveFile(`${mapFileName}.tsv`, str, () => {})
      saveJsonFile(`${mapFileName}.json`, keys, () => {})
    });
  }
}

const replaceKeysInTheJsonFile = (mapFileUri, templateFileUri, outputFileUri) => {
  const v1 = validate('jsonFileName', mapFileUri);
  const v2 = validate('jsonFileName', templateFileUri);
  const v3 = validate('jsonFileName', outputFileUri);

  if(v1 && v2 && v3) {
    fs.readFile(`${mapFileUri}`, (err, mapKeys) => {
      fs.readFile(`${templateFileUri}`, (err, template) => {
        const tree = replaceValuesByKeys(mapKeys, template);
        saveJsonFile(outputFileUri, convertNodeIntoJson(tree), () => {})
      });
    });
  }
}

const convertCSVIntoJson = (csvFileUri, outputFileUri) => {
  const v1 = validate('isTsvFile', csvFileUri);
  const v2 = validate('jsonFileName', outputFileUri);

  if(v1 && v2) {
    const results = [];
    fs.createReadStream(`${csvFileUri}`)
      .pipe(csv({ separator: '\t', headers: ['key', 'value']},))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        fs.readFile(outputFileUri, (err, jsonFile) => {
          let json = jsonFile.toString();
          let line = 1;
          for (line of sanitizeResults(results)) {
            try {
              const re = new RegExp(`(?<=\")${line.key}(?=\")`, 'g');
              json = json.replace(re, line.value)
              line++;
            } catch(err) {
              printError(`Error in line #${line} with key ${line.key} value ${line.value}. Error: ${err} `);
            }
          }
          saveJsonFile(`${outputFileUri}`, JSON.parse(json), () => {})
        });
      });
  }
}

program
  .command('generate')
  .option('-f,--file <file>')
  .option('-m,--map <name>')
  .action((opts) => {
    generateKeys(opts.file, opts.map);
  });

program
  .command('replace')
  .option('-m,--map <file>')
  .option('-t,--template <file>')
  .option('-o,--output <file>')
  .action((opts) => {
    replaceKeysInTheJsonFile(opts.map, opts.template, opts.output);
  });

program
  .command('convert')
  .option('-t,--tsv <file>')
  .option('-o,--output <file>')
  .action((opts) => {
    convertCSVIntoJson(opts.tsv, opts.output);
  });

program.parse(process.argv);


/*

* error handler
* sanitizer for regular quotes

*/