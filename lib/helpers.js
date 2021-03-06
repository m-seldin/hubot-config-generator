'use strict';

const fs = require('fs'),
    path = require('path'),
    log4js = require('log4js'),
    url = require('url');
global.logger = log4js.getLogger();
global.Fs = fs;
global.Path = path;
global.Url = url;

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

exports.pathExists=function(path){
    try {
        // Query the entry
        let stats = fs.lstatSync(path);

        return true;
    }
    catch (e) {
        return false;
    }
};
