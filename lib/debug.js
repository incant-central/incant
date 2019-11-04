'use strict';

const { DEBUG, DRY_RUN } = require('./constants');
const { inspect } = require('util');
const { EOL } = require('os');
const chalk = require('chalk');

exports.debug = (label, value) => {
    const debug = !!process.env[DEBUG];
    if (debug) process.stdout.write(`${EOL}${chalk.yellow(label)}${EOL}${inspect(value, { colors: true, depth: null })}${EOL}`);
};

exports.dry_run = value => {
    const dry_run = !!process.env[DRY_RUN];
    if (dry_run) process.stdout.write(JSON.stringify(value, null, 2));
};
