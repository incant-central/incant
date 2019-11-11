'use strict';

const { DEBUG, PRINT_MACHINE } = require('./constants');
const { inspect } = require('util');
const { EOL } = require('os');
const chalk = require('chalk');

exports.debug = (label, value) => {
    const debug = !!process.env[DEBUG];
    if (debug) process.stdout.write(`${EOL}${chalk.yellow(label)}${EOL}${inspect(value, { colors: true, depth: null })}${EOL}`);
};

exports.print_machine = value => {
    const print_machine = !!process.env[PRINT_MACHINE];
    if (print_machine) process.stdout.write(JSON.stringify(value, null, 2));
};
