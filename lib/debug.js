'use strict';

const { DEBUG, DRY_RUN } = require('./constants');
const { inspect } = require('util');
const { EOL } = require('os');
const chalk = require('chalk');

exports.debug = (label, value) => {
    const debug = !!process.env[DEBUG];
    const dry_run = !!process.env[DRY_RUN];
    if (debug || dry_run) {
        process.stdout.write(`${dry_run ? JSON.stringify(value, null, 2) : `${EOL}${chalk.yellow(label)}${EOL}${inspect(value, { colors: true, depth: null })}`}${EOL}`);
    }
};
