//
// Copyright 2016 Michael Seldin
//     Licensed under the Apache License, Version 2.0 (the "License");
//     you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
//     Unless required by applicable law or agreed to in writing,
//     Software distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and limitations under the License.
//
//  Author:
//  Michael Seldin

'use strict';

const Helpers = require('./helpers.js');
const os = require('os')
const spawn = require('child_process').spawn;
const readLineSync = require('readline-sync');
const REG_EXP_CONFIG_SECTION= new RegExp("# Configuration:\r\n(# .*\r\n)*".replace("\r\n",os.EOL));

function HubotConfigGenerator(ops,configFileName) {
    this.ops = ops;
    this.scriptsDir = Path.join(this.ops.hdir,'node_modules');
    this.configFileName = configFileName;
    let externalScriptsPath = Path.join(this.ops.hdir,'external-scripts.json');

    this.externalScripts = JSON.parse(Fs.readFileSync(externalScriptsPath, 'utf8'));
}

HubotConfigGenerator.prototype.generateConfig = function(){

    logger.debug(`External scripts : ${JSON.stringify(this.externalScripts)}`);

    let globalConfigsMap = {};
    for(let script of this.externalScripts){

        if(script!="hubot-apppulsemobile") continue;
        let scriptDir = Path.join(this.scriptsDir,script);
        let scriptEnvConfigs = this.getScriptConfigs(scriptDir)
        let scriptConfigsMap = this.promtForConfigs(scriptEnvConfigs);

        console.log(JSON.stringify(scriptConfigsMap));

        for(let key of Object.keys(scriptConfigsMap)){
            console.log ("Key : " + key);
            if(!globalConfigsMap.key){
                globalConfigsMap[key] = scriptConfigsMap[key];
            }
        }
    }

    Fs.writeFileSync(this.configFileName, JSON.stringify(globalConfigsMap, null, 4));
};

HubotConfigGenerator.prototype.promtForConfigs = function(configs){
    let configsMap = {};
    for(let config of configs){
        if(config.description)
            console.log(config.description);
        if(config.defaultValue)
            console.log(`Default value=${config.defaultValue}`);
        configsMap[config.value] = readLineSync.question(`${config.value}:`,{defaultInput:config.defaultValue});
    }

    return configsMap;
};

HubotConfigGenerator.prototype.getScriptConfigs = function(scriptPath){
    let retVal = [];
    let sourceDir = Path.join(scriptPath,'src');

    let sourceFiles = Helpers.walkDirSync(sourceDir,".coffee");
    logger.debug(`Result files for ${scriptPath} are : ${JSON.stringify(sourceFiles)}`);

    for(let sourceFile of sourceFiles){
        if(sourceFile.indexOf("apm-mobile-bot-logic.coffee")<0) continue;
        console.log(`Config section for file  ${sourceFile}`);

        let fileText  = Fs.readFileSync(sourceFile, 'utf8');

        console.log(fileText);
        let configSection = fileText.match(REG_EXP_CONFIG_SECTION)[0];

        console.log("Config section : ");
        console.log(configSection);


        for(let config of configSection.split(os.EOL)){
            if(config.indexOf("Configuration:")>=0) continue;
            config = config.replace(/# */,"");
            config = config.replace(/\t/,"");
            if(!config.match(/\w+/)) continue;

            let configObj ={};
            if(config.match(/"([^"]*)"/)){
                let defaultValue = config.match(/"([^"]*)"/)[1];
                configObj.description = config.substring(config.indexOf(defaultValue) + defaultValue.length+1).trim();
                configObj.value = config.substring(0, config.indexOf(defaultValue)-1);
                configObj.defaultValue = defaultValue;
            }else{
                configObj.description =null;
                configObj.value = config;
                configObj.defaultValue = null
            }


            console.log(`Value : ${configObj.value}`);
            console.log(`Default Value : ${configObj.defaultValue}`);
            console.log(`Desc : ${configObj.description}`);


            retVal.push(configObj);
        }

        return retVal;
    }



};


module.exports = HubotConfigGenerator;