'use strict';

if (parseInt(process.versions.node.split('.')[0]) < 12) throw new Error('Incant requires Node.js v12 or newer.');

const { Incant } = require('./lib/incant');

module.exports = { Incant };
