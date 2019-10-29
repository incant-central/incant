'use strict';

const { inspect } = require('util');
const debug = exports.debug = !!process.env.DEBUG;
const dry_run = exports.dry_run = !!process.env.DRY_RUN;
const log = exports.log = (l, v) => (debug || dry_run) && console.log(`${dry_run ? JSON.stringify(v, null, 2) : `${l}\n${inspect(v, { colors: true, depth: null })}`}`);
