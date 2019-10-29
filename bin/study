#!/usr/bin/env node

const Answers = require('Answers');
const { load, sourceExpander } = require('../lib/load');
const { stateSchema } = require('../lib/schema');
const path = require('path');
const callsites = require('callsites');
const { resolveTarget } = require('../lib/resolve');
const ShellSpec = require('shellspec');
const { inspect } = require('util');

(async () => {
    const calledFrom = callsites()[1].getFileName();
    const rawConfig = await Answers({
        name: 'incant',
        argv: process.argv.slice(2),
        loaders: [ sourceExpander ]
    });
    const config = await stateSchema.validate(rawConfig);
    const { source } = config;
    const targets = await load({ patterns: source, cwd: path.dirname(calledFrom) });
    const targetName = config._[0];
    const target = resolveTarget(targets, targetName);
    if (target.kind !== 'shell') throw new Error('no');
    const targetNameParts = targetName.split('.');
    const subcommand = targetNameParts.length > 1
        ? targetNameParts.slice(-1).join('.')
        : null;
    const configPaths = ShellSpec(target).getConfigPaths(subcommand);
    console.log(inspect(configPaths, { depth: null, colors: true }));

})();
