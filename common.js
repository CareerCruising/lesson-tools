
const fs = require('fs');


const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);

const printError = (message) => console.log('\x1b[41m',`${message}`,'\x1b[0m');

const trace = label => value => {
    console.log(`${ label }: ${ value }`);
    return value;
};

const jsonToObject = (json) => {
    return JSON.parse(JSON.stringify(json));
}
  
const createKeyFromPath = (path) => {
    if(typeof path === 'string') {
        return path.replace(/\//g, '_').toUpperCase().substring(1);
    } else {
        return path;
    }
}

const replaceQuotes = (text) => {
    if(text === undefined || text === '' || text === null) return '';
    try {
        console.log('quotes found')
        return text.replace(/["]/g, '&#39;');
    } catch(e) {
        printError(`Replace Quotes has failed in attempt to change: ${text}`);
    }
}

const sanitizeResult = (params) => {
    // console.log('params', params ); // #fbr #console
    return params.results.map(v => {
        const obj = {}
        for(let header of params.headers) {
            if(v[header]) {
                if(v[header].search(/(")/g)) {
                    obj[header] = sanitizeTsv(v[header])
                } else {
                    obj[header] = v[header];
                }
            }
        }
        // console.log('obj', obj ); // #fbr #console
        return obj;
    });
}

const sanitizeTsv = compose(replaceQuotes);
const sanitizeResults = compose(sanitizeResult)

/**
 * 
 * @param {jsonObject} node
 * @return string
 */
const checkType = (node) => {
    const type = typeof node;

    if(type === 'string' || type === 'number' || type === 'boolean') {
        return type;
    } else if(type === 'object') {
        const isArray = Array.isArray(node);
        return isArray ? 'array' : type;
    }
}

const saveFile = (filename, body, callback) => {
    fs.writeFile(filename, body, (err) => {
        if (err) throw err;
        callback(body)
    });
}
  
const saveJsonFile = (filename, body, callback) => {
    fs.writeFile(filename, JSON.stringify(body), (err) => {
        if (err) throw err;
        callback(body)
    });
}

class Node {
    constructor(path, name, type, fields = null, objectType) {
        this.path = path;
        this.name = name;
        this.type = type;
        this.fields = fields;
        this.fieldKeys = fields !== null ? Object.keys(fields) : [];
        this.objectType = objectType;
    }

    get() {
        return this;
    }

    setName(value) {
        this.name = value;
    }

    setValue(value) {
        this.value = value;
    }

    getValue() {
        return this.value;
    }

    getName() {
        return this.name;
    }

    getFields() {
        return this.fields;
    }

    isObject() {
        return this.type === 'object';
    }

    isSingle() {
        return this.objectType === 'single';
    }

    getField(node) {
        return this.fields[node];
    }

    hasFields() {
        return this.fields !== null || this.fields !== undefined;
    }

    getType() {
        return this.type;
    }

    getPath() {
        return this.path;
    }

    getFieldKeys() {
        return this.fieldKeys;
    }

    getObjectType() {
        return this.objectType;
    }
}
  
class SingleNode extends Node {
    constructor( path, name, type, value, initialValue) {
        super(path, name, type, null, 'single');
        this.value = value;
        this.initialValue = initialValue;
    }

    setValue(value) {
        this.value = value;
    }
}
  
class ArrayNode extends Node {
    constructor(path, name, type, fields, data) {
        super(path, name, type, fields, 'array');
    }
}
  
class ObjectNode extends Node {
    constructor(path, name, type, fields) {
        super(path, name, type, fields, 'object');
    }
}
  
const recursiveNode = (path, name, value) => {
    const t =  checkType(value);

    if(t === 'string' || t === 'number' || t == 'boolean') {
        return new SingleNode(path, name, t, value, '');
    } else if (t === 'object') {
        const obj = {};
        for( let v of Object.keys(value)){
            obj[v] = recursiveNode(`${path}/${v}`,v, value[v])
        }
        return new ObjectNode(`${path}`,name, t, obj);
    } else if(t === 'array') {
        const obj = {};
        for( let v of Object.keys(value)){
            obj[v] = recursiveNode(`${path}/${v}`,v, value[v]);
        }
        return new ArrayNode(`${path}`,name, t, obj, value);
    } else {
        //...
    }
}
  
const convertNodeIntoJson = (node) => {

    if ( node.getObjectType() === 'single' ) {
      return node.getValue();
    } else if (
      node.getObjectType() === 'object'
    ) {
      const out = {};
      for ( let key of node.getFieldKeys()) {
        out[key] = convertNodeIntoJson(node.getField(key));
      }
      return out;
    } else if (node.getObjectType() === 'array') {
      const out = [];
      for ( let key of node.getFieldKeys()) {
        out[key] = convertNodeIntoJson(node.getField(key));
      }
      return out;
    } else {
      //...
    }
}
  
const replaceValuesByKeys = (keys, template) => {
    const mapKeysArr = JSON.parse(keys.toString());
    const tree = recursiveNode('', '', JSON.parse(template.toString()));
    let item = tree;
    for ( let kmap of mapKeysArr ) {
      const pathArray = kmap.path.split('/').filter(e => e !== '');
      const nav = (pathArray, node) => {
        const seg = pathArray.shift();
        if (pathArray.length < 1) {
          node.getField(seg).setValue(kmap.key);
        } else {
          nav(pathArray, node.getField(seg));
        }
      }
  
      nav(pathArray, item);
    }
  
    return tree;
}
  
const extractKeys = (nodeList) => {
    const keys = [];
  
    const getTextKeys = (node) => {
      for (const fk of node.getFieldKeys()) {
        const field = node.getField(fk);
        if(field.getObjectType() !== 'single') {
          getTextKeys(field.get());
        } else {
          if(field.getName().includes('Text')) {
            try {
                keys.push({
                  path: field.getPath(),
                  key: createKeyFromPath(field.getPath()),
                  value: field.getValue().replace(/(\r\n|\n|\r)/gm, "")
                });
            } catch(e) {
                console.log(e, field);
                printError(`Error ${e} on field ${field}`)
            }
          }
        }
      }
    }
  
    getTextKeys(nodeList);
  
    return keys;
}


module.exports = {
    recursiveNode,
    extractKeys,
    saveFile,
    saveJsonFile,
    replaceValuesByKeys,
    convertNodeIntoJson,
    createKeyFromPath,
    sanitizeResults,
    printError,
    sanitizeTsv
}
