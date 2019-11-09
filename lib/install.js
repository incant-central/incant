'use strict';

const requireg = require('requireg');
const execa = require('execa');
const resolveGlobal = require('resolve-global');
const inquirer = require('inquirer');

async function jitInstall(pkgName) {
    if (resolveGlobal.silent(pkgName) != null) return requireg(pkgName);
    const answers = await inquirer.prompt([
        {
            name: 'confirm',
            type: 'confirm',
            message: `Cool if I install \`${pkgName}\` from npmjs.com? It looks like you need it.`
        }
    ]);
    if (!answers.confirm) {
        console.log(`Roger that. Aborting. You can always manually install with \`npm i -g ${pkgName}\`.`);
        process.exit(1);
    }
    try {
        await execa('npm', [ 'install', '--silent', '-g', pkgName ], { stdio: 'inherit' });
        return requireg(pkgName);
    } catch (e) {
        throw new Error(`Unable to install ${pkgName}`);
    }
}

module.exports = { jitInstall };
