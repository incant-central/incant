'use strict';

const { DEBUG, DRY_RUN } = require('./constants');
const { inspect } = require('util');
const { EOL } = require('os');

exports.debug = (label, value) => {
    const debug = !!process.env[DEBUG];
    const dry_run = !!process.env[DRY_RUN];
    if (debug || dry_run) {
        console.log(`${EOL}${dry_run ? JSON.stringify(value, null, 2) : `${label}\n${inspect(value, { colors: true, depth: null })}`}${EOL}`);
    }
};
