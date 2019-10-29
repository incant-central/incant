'use strict';

const { inspect } = require('util');

const debug = exports.debug = !!process.env.DEBUG;
const dry_run = exports.dry_run = !!process.env.DRY_RUN;

const log = exports.log = (label, value) =>
    (debug || dry_run) && console.log(`${dry_run ? JSON.stringify(value, null, 2) : `${label}\n${inspect(value, { colors: true, depth: null })}`}`);
