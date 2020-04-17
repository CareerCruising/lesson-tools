const {printError} = require('./common');

const validationMethods = {
    mapFileName: (input) => {
        const regex = /\..{1,3}$/gm;
        const result = regex.test(input);
        if(result) throw new Error(`The option ${input} does not expect a file name with extension. Follow the "./dirname/filename" format`);
        return true;
    },
    jsonFileName: (input) => {
        const regex = /\.json$/gm;
        const result = regex.test(input);
        if(!result) throw new Error(`The input ${input} is not valid. It must be a *.json file.`);
        return true;
    }, 
    isTsvFile: (input) => {
        const regex = /\.tsv$/gm;
        const result = regex.test(input);
        if(!result) throw new Error(`The value "${input}" must be a *.tsv file.`);
        return true;
    } 
}

const validate = (functionName, input) => {
    try {
        if(!validationMethods[functionName]) throw 'Method does not exist';
        const result = validationMethods[functionName](input);
        return result;
    } catch(e) {
        printError(`ERROR: ${e}`);
    }
}


module.exports = {
    validate
}