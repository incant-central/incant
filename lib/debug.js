'use strict';

const { DEBUG, PRINT } = require('./constants');
const { inspect } = require('util');
const { EOL } = require('os');
const chalk = require('chalk');

exports.debug = (label, value) => {
    const debug = !!process.env[DEBUG];
    if (debug) process.stdout.write(`${EOL}${chalk.yellow(label)}${EOL}${inspect(value, { colors: true, depth: null })}${EOL}`);
};

exports.print = value => {
    const print = !!process.env[PRINT];
    if (print) process.stdout.write(JSON.stringify(value, null, 2));
};
