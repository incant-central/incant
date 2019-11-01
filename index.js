#!/usr/bin/env node

const path = require('path');
const sota  = require('sota');
const { Trajectory } = require('trajectory');
const DefaultAnswers = require('answers');
const callsites = require('callsites');
const { debug, dry_run, log } = require('./lib/debug');
const { load, sourceExpander } = require('./lib/load');
const { optionsSchema, stateSchema  } = require('./lib/schema');
const { prefixOptions } = require('./lib/util');
const { resolveTarget, loadResource, SubmachineResolver } = require('./lib/resolve');
const { handleError } = require('./lib/error');

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
        const config = await stateSchema.validate(await Answers({
            name,
            argv: prefixOptions(argv),
            loaders: [ sourceExpander ]
        }));

        /**
         * Sota - compile state machine definition
         */
        const source = [ ...givenSource, ...config.source.flat(Infinity) ];
        const loadedTargets = await load({ patterns: source, cwd: path.dirname(calledFrom) });
        const targets = { ...givenTargets, ...loadedTargets }
        const machine = await sota.readAll(config._, { resolver: SubmachineResolver(targets) });

        log('state machine definition:', machine);
        if (dry_run) process.exit(0);

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
                printLabels: {
                    succeed: debug,
                    start: true,
                    info: debug,
                    fail: true,
                    error: true,
                    final: debug,
                    complete: debug,
                    stdout: true,
                    stderr: true
                },
                printEvents: {
                    succeed: false,
                    start: debug,
                    info: false,
                    fail: true,
                    error: true,
                    final: true,
                    complete: debug,
                    stdout: true,
                    stderr: true
                }
            },
            resources: trajectoryResources,
            debug
        };

        const trajectory = new Trajectory(trajectoryOptions);

        return trajectory.execute(machine, config.input);

    } catch (e) {
        handleError(e);
    }
}

module.exports = { Incant };
