'use strict';

const fs = require('fs'),
    path = require('path'),
    log4js = require('log4js');

global.logger = log4js.getLogger();
global.Fs = fs;
global.Path = path;

exports.walkDirSync = function(dir,filter){
    let files = Fs.readdirSync(dir);

    let retVal = [];

    for(let file of files){
        let fullPath = Path.join(dir,file);
        if(Fs.statSync(fullPath).isDirectory()){
            retVal = retVal.concat(this.walkDirSync(fullPath,filter));
        }else{
            if(Path.extname(fullPath)==filter)
                retVal.push(fullPath);
        }
    }
    return retVal
};
