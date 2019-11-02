#!/usr/bin/env node

const path = require('path');
const sota = require('sota');
const { Trajectory } = require('trajectory');
const DefaultAnswers = require('answers');
const callsites = require('callsites');
const constants = require('./lib/constants');
const { debug } = require('./lib/debug');
const { load, sourceExpander } = require('./lib/load');
const { optionsSchema, configSchema } = require('./lib/schema');
const { prefixOptions } = require('./lib/util');
const { resolveTarget, loadResource, SubmachineResolver } = require('./lib/resolve');
const { handleError } = require('./lib/error');
const { EOL } = require('os');

async function Incant(options = {}) {
    try {
        const calledFrom = callsites()[1].getFileName();

        const {
            name = 'incant',
            argv = process.argv.slice(2),
            targets:givenTargets = {},
            source:givenSource,
            loaders = {},
            __Answers__:Answers = DefaultAnswers
        } = await optionsSchema.validate(options);

        process.title = name;

        /**
         * Answers - load argv and config
         */
        const config = await configSchema.validate(await Answers({
            name,
            argv: prefixOptions(argv),
            loaders: [ sourceExpander ]
        }));

        const DEBUG = process.env[constants.DEBUG] || config['--'].includes('--debug') || (config.settings || {}).debug;
        const DRY_RUN = process.env[constants.DRY_RUN] || config['--'].includes('--dry-run') || (config.settings || {}).dry_run;
        const VERBOSE = process.env[constants.VERBOSE] || config['--'].includes('-v') || config['--'].includes('--verbose') || (config.settings || {}).verbose;
        const COMPACT = process.env[constants.COMPACT] || config['--'].includes('-c') || config['--'].includes('--compact') || (config.settings || {}).compact;
        if (DEBUG) process.env[constants.DEBUG] = DEBUG;
        if (DRY_RUN) process.env[constants.DRY_RUN] = DRY_RUN;

        debug('CONFIG', config);
        if (config._.length === 0) {
            process.stdout.write(`nothing to do...${EOL}`);
            return;
        }

        /**
         * Sota - compile state machine definition
         */
        const source = [ ...givenSource, ...config.source.flat(Infinity) ];
        const loadedTargets = await load({ patterns: source, cwd: path.dirname(calledFrom) });
        const targets = { ...givenTargets, ...loadedTargets }
        const machine = await sota.readAll(config._, { resolver: SubmachineResolver(targets) });

        debug('STATE MACHINE DEFINITION', machine);
        if (DRY_RUN) process.exit(0);

        /**
         * Trajectory - execute state machine
         */
        const trajectoryResourceCache = new WeakMap();

        const trajectoryResources = new Proxy({}, {
            get(_, name) {
                return trajectoryResourceCache[name] || loadResource(name, resolveTarget(targets, name), loaders);
            }
        });

        const trajectoryOptions = {
            reporterOptions: {
                cols: 0,
                compact: COMPACT,
                gutterWidth: 12,
                printEvents: {
                    succeed: true,
                    start: DEBUG,
                    info: VERBOSE,
                    fail: true,
                    error: true,
                    final: DEBUG,
                    complete: DEBUG,
                    stdout: true,
                    stderr: true
                }
            },
            resources: trajectoryResources,
            debug: DEBUG
        };

        const trajectory = new Trajectory(trajectoryOptions);

        return trajectory.execute(machine, config.input);

    } catch (e) {
        handleError(e);
    }
}

module.exports = { Incant };
