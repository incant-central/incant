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
            message: `May I install \`${pkgName}\` from npmjs.com? It would appear you need it.`
        }
    ]);
    if (!answers.confirm) {
        console.log(`Got it. Execution aborted. Note that you can manually install the missing dependency with \`npm i -g ${pkgName}\`.`);
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
