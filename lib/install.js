'use strict';

const { INSTALL } = require('./constants');
const chalk = require('chalk');
const path = require('path');
const { EOL } = require('os');
const requireg = require('requireg');
const execa = require('execa');
const resolveGlobal = require('resolve-global');
const inquirer = require('inquirer');
const got = require('got');

class DeprecationError extends Error {
    constructor(message, cause, ...args) {
        super(message, cause, ...args);
        Error.captureStackTrace(this, DeprecationError);
        this.name = 'DeprecationError';
        this.code = 'DEPRECATED';
        if (cause) this.cause = cause;
    }
}

const missCache = new WeakSet();

async function jitInstall(pkgName, { allowDeprecated = false } = {}) {
    if (missCache.has(pkgName)) throw new Error(chalk`{bold {blue ${pkgName}} can not be resolved.}${EOL}`);
    if (resolveGlobal.silent(pkgName) != null) return requireg(pkgName);
    const { stdout } = await execa('npm', [ 'show', '-json', pkgName ], { all: true, reject: false });
    const npmInfo = JSON.parse(stdout);
    const { error = false, deprecated = false } = npmInfo;
    if (error || pkgName !== npmInfo.name) throw new Error(chalk`{bold {blue ${pkgName}} can not be resolved.}${EOL}`);
    if (!allowDeprecated && deprecated) throw new DeprecationError(chalk`{bold {blue ${pkgName}} is deprecated. Refusing to install.}${EOL}`);
    if (process.env[INSTALL] !== 'auto') {
        const answers = await inquirer.prompt([
            {
                name: 'confirm',
                type: 'confirm',
                message: `May I install \`${pkgName}\` from npmjs.com? It seems you need it.`
            }
        ]);
        if (!answers.confirm) {
            process.stderr.write(chalk`{bold Got it. Note that you can manually install the missing dependency with \`{yellow npm i -g ${pkgName}}\`.}${EOL}`);
            process.stdout.write(chalk`{dim Execution aborted.}${EOL}`);
            process.exit(1);
        }
    }
    try {
        await execa('npm', [ 'install', '--silent', '-g', pkgName ], { stdio: 'inherit' });
        const { stdout:prefix } = await execa('npm', [ 'config', 'get', 'prefix' ]);
        process.stdout.write(chalk`{bold {blue ${pkgName}} installed to {yellow ${path.join(prefix, 'lib', 'node_modules', pkgName)}}.}${EOL}`);
        process.stdout.write(chalk`{bold {blue ${pkgName}} will autoload on subsequent executions. Run \`{yellow npm update -g ${pkgName}}\` for updates.}${EOL}`);
        process.stdout.write(chalk`{dim Resuming execution…}${EOL}`);
        return requireg(pkgName);
    } catch (e) {
        missCache.add(pkgName);
        throw new Error(`Unable to install ${pkgName}`);
    }
}

module.exports = { jitInstall };
