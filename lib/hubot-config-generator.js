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
const os = require('os');
const spawn = require('child_process').spawn;
const readLineSync = require('readline-sync');
const chalk = require('chalk');
const REG_EXP_CONFIG_SECTION= new RegExp("# Configuration:\r\n(# .*\r\n)*".replace("\r\n",os.EOL));

function HubotConfigGenerator(hubotDir,configFileName) {
    this.scriptsDir = Path.join(hubotDir,'node_modules');
    this.configFileName = configFileName;
    let externalScriptsPath = Path.join(hubotDir,'external-scripts.json');

    this.externalScripts = JSON.parse(Fs.readFileSync(externalScriptsPath, 'utf8'));

    let configFileDir = Path.dirname(configFileName);
    if(!Helpers.pathExists(configFileDir)){
        let errMsg = `Directory for configuration file doesn't exist! (${configFileDir})`;
        throw(errMsg);
    }
}

HubotConfigGenerator.prototype.generateConfig = function(){

    logger.debug(`External scripts : ${JSON.stringify(this.externalScripts)}`);


    let scriptGlobalConfigsForPrompt = [];
    let allConfigsMaps ={};
    let scriptSpecificConfigsForPrompt =[];
    for(let script of this.externalScripts) {
        let scriptSpecificConfigsMap = [];
        let scriptDir = Path.join(this.scriptsDir, script);
        let scriptEnvConfigs = this.getScriptConfigs(scriptDir);

        for (let config of scriptEnvConfigs) {
            if (!(config.value in allConfigsMaps)) {
                scriptSpecificConfigsMap.push(config);
            }
            else {
                logger.debug(`Configuration name ${JSON.stringify(config)}`);
                scriptGlobalConfigsForPrompt.push(config);
            }
            allConfigsMaps[config.value] = config;
        }
        let resObj = {};
        resObj.scriptName = script;
        resObj.configs = scriptSpecificConfigsMap;

        scriptSpecificConfigsForPrompt.push(resObj);
    }

    let filledConfigs ={};

    Object.assign(filledConfigs, this.promptForConfigs("Global Configs", scriptGlobalConfigsForPrompt));

    for(let objects of scriptSpecificConfigsForPrompt) {
        Object.assign(filledConfigs,this.promptForConfigs(objects.scriptName, objects.configs,scriptGlobalConfigsForPrompt));
    }

    console.log(`Configuration file was written to : ${this.configFileName}`);
    Fs.writeFileSync(this.configFileName, JSON.stringify(filledConfigs, null, 4));
};

HubotConfigGenerator.prototype.promptForConfigs = function(scriptName, configs,globalConfigs){
    let configsMap = {};
    console.log('');
    console.log(chalk.gray.underline.bgWhite.underline.bold.italic(`Script ${scriptName} configs:`));
    console.log('');
    for(let config of configs){

        if(globalConfigs){
            if(globalConfigs.filter(function(e){return e.value == config.value;}).length>0) continue;
        }

        let descriptionStr = "";
        let defaultValueStr = "";

        descriptionStr= `Description : ${config.description ? config.description : 'None'}`;
        defaultValueStr= `Default:${config.defaultValue ? config.defaultValue : 'None'}`;

        console.log(chalk.green(descriptionStr));
        console.log(chalk.green(defaultValueStr));

        configsMap[config.value] = readLineSync.question(config.value + ":",{defaultInput:config.defaultValue});

        console.log('');
    }

    if(Object.keys(configsMap).length==0){
        console.log(chalk.yellow(`No entries found for ${scriptName}`));
    }

    console.log(`Finished ${scriptName}`);
    return configsMap;
};

HubotConfigGenerator.prototype.getScriptConfigs = function(scriptPath){
    let retVal = [];
    let sourceDir = Path.join(scriptPath,'src');

    let sourceFiles = Helpers.walkDirSync(sourceDir,".coffee");
    //logger.debug(`Result files for ${scriptPath} are : ${JSON.stringify(sourceFiles)}`);

    for(let sourceFile of sourceFiles){
        let fileText  = Fs.readFileSync(sourceFile, 'utf8');

        let match = fileText.match(REG_EXP_CONFIG_SECTION);

        if(match==null) continue; //nothing interesting found in this file...

        let configSection = match[0];

        for(let config of configSection.split(os.EOL)){
            if(config.indexOf("Configuration:")>=0) continue;
            config = config.replace(/# */,"");
            config = config.replace(/\t/,"");
            if(!config.match(/\w+/)) continue;

            let configObj ={};
            if(config.match(/"([^"]*)"/)){
                let defaultValue = config.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[1];
                configObj.description = config.substring(config.lastIndexOf('"') +1).trim();
                configObj.value = config.substring(0, config.indexOf(defaultValue)-1);
                configObj.defaultValue = defaultValue.replace('"',"");
            }else{
                configObj.description =null;
                configObj.value = config;
                configObj.defaultValue = null
            }

            retVal.push(configObj);
        }
    }

    return retVal;



};


module.exports = HubotConfigGenerator;