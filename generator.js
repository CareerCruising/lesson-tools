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
  printError,
  sanitizeTsv
} = require('./common.js');

const {
  validate
} = require('./validation');


const generateKeys = (fileName) => {
  // console.log(fileName)
  /** validation */
  const v1 = validate('mapFileName', fileName);

  if(v1) {
    fs.readFile(`${fileName}_template.json`, (err, template) => {
      const nodeList = recursiveNode('', '', JSON.parse(template.toString()));
      const keys = extractKeys(nodeList);
      const languages = ['en-CA','en-US' ,'fr-CA', 'es-US'].reduce((p, a) =>  p + '\t'+ a );
      str = '';
      str+= 'keys \t'+languages+'\n';
      for(let path of keys ) {
        str += path.key +'\t' + path.value + '\n';
      }
    
      saveFile(`${fileName}_map.tsv`, str, () => {
        
      })
      saveJsonFile(`${fileName}_map.json`, keys, () => {
        const tree = replaceValuesByKeys(JSON.stringify(keys), template);
        saveJsonFile(`${fileName}_map-template.json`, convertNodeIntoJson(tree), () => {})
      })
    });
  }
}

const sanitizing = (fileName) => {
  const v1 = validate('mapFileName', fileName);
  if(v1) {
    fs.readFile(`${fileName}.tsv`, (err, jsonFile) => {
      const sanitized = sanitizeTsv(jsonFile.toString());
      saveFile(`${fileName}.tsv`, sanitized, () => {});
    })
  }
}

const convertCSVIntoJson = (tsv, fileName, output) => {
  const v1 = validate('isTsvFile', tsv);
  const v2 = validate('mapFileName', fileName);
  const v3 = validate('mapFileName', output);

  if(v1 && v2 && v3) {
    const results = [];
    const languages = ['en-CA','en-US' ,'fr-CA', 'es-US'];
    const _headers = ['key', ...languages];
    fs.createReadStream(`${tsv}`)
      .pipe(csv({ separator: '\t', headers: _headers},))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        fs.readFile(`${fileName}_map-template.json`, (err, jsonFile) => {
          let lineN = 1;
          for(languageColumn of languages) {
            let json = jsonFile.toString();
            for (line of results) {
              try {
                if(line.key) {
                  const re = new RegExp(`(?<=\")${line.key}(?=\")`, 'g');  
                  json = json.replace(re, line[languageColumn]);
                  lineN++;
                }
              } catch(err) {
                printError(`Error in line #${line} with key ${line.key} value ${line[languageColumn]}. Error: ${err} `);
              }
            }
            saveJsonFile(`${output}_${languageColumn}.json`, JSON.parse(json), () => {})
          }
        });
      });
  }
}

program
  .command('generate')
  .option('-f,--fileName <name>')
  .action((opts) => {
    generateKeys(opts.fileName);
  });

program
  .command('sanitize')
  .option('-f,--fileName <name>')
  .action((opts) => {
    sanitizing(opts.fileName);
  });

program
  .command('convert')
  .option('-t,--tsv <tsv>')
  .option('-f,--fileName <name>')
  .option('-o,--output <file>')
  .action((opts) => {
    convertCSVIntoJson(opts.tsv, opts.fileName, opts.output);
  });

program.parse(process.argv);


/*

* error handler
* sanitizer for regular quotes

*/