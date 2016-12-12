/**
 * Created by seldin on 12/12/2016.
 */

const Helpers = require('./helpers.js');
const crossSpawn = require('cross-spawn');

function isValidURL(str) {
    var pattern = new RegExp('^(https?:\/\/)?'+ // protocol
        '((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|'+ // domain name
        '((\d{1,3}\.){3}\d{1,3}))'+ // OR ip (v4) address
        '(\:\d+)?(\/[-a-z\d%_.~+]*)*'+ // port and path
        '(\?[;&a-z\d%_.~+=-]*)?'+ // query string
        '(\#[-a-z\d_]*)?$','i'); // fragment locater
    if(!pattern.test(str)) {
        return false;
    } else {
        return true;
    }
}

function getNewPackageName(packageJson,integration){
    for (var dep in packageJson.dependencies) {
        if(integration.endsWith("/") || integration.endsWith("\\")){
            integration = integration.substr(0,integration.length-2);
        }

        if(dep.includes(integration) || packageJson.dependencies[dep].includes(integration)){

            return dep;
        }
    }
    return null;
}

exports.addIntegrations = function(integrations,hubotDir){
    for(let integration of integrations){
        logger.debug(`Trying to install integration ${integration}`);
        crossSpawn.sync('npm', ['install', integration,'--save'], { stdio: 'inherit' });
        let packages = JSON.parse(Fs.readFileSync('package.json').toString());

        let dependencyName = getNewPackageName(packages,integration);

        let externals = JSON.parse(Fs.readFileSync('external-scripts.json').toString());
        let exists = false;
        for(let externalDep of externals ){
            if(externalDep===dependencyName){
                exists = true;
            }
        }
        if(!exists) {
            externals = externals.concat(dependencyName);
            Fs.writeFileSync('external-scripts.json',JSON.stringify(externals));
        }

        logger.info(`Added dependency : ${dependencyName}`);
    }
};
