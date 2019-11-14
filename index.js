'use strict';

if (parseInt(process.versions.node.split('.')[0]) < 12) throw new Error('Incant requires Node.js v12 or newer.');

const path = require('path');
const sota = require('sota');
const { Trajectory } = require('trajectory');
const DefaultAnswers = require('answers');
const callsites = require('callsites');
const { debug, print } = require('./lib/debug');
const { load, sourceExpander } = require('./lib/load');
const { optionsSchema, configSchema } = require('./lib/schema');
const { prefixOptions, setEnv } = require('./lib/util');
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

        const cliOptionsIdx = argv.indexOf('--');
        const hasCliOptions = cliOptionsIdx == -1;

        const cliStates = hasCliOptions
            ? argv
            : argv.slice(0, cliOptionsIdx);

        const cliOptions = hasCliOptions
            ? []
            : argv.slice(cliOptionsIdx + 1);

        process.title = name;

        /**
         * Answers - load argv and config
         */
        const config = await configSchema.validate(await Answers({
            name,
            argv: cliOptions,
            loaders: [ sourceExpander ]
        }));

        const {
            DEBUG,
            PRINT,
            VERBOSE,
            QUIET,
            PIPE
        } = setEnv(config);

        debug('CONFIG', config);
        if (cliStates.length === 0) {
            process.stdout.write(`nothing to do...${EOL}`);
            return;
        }

        /**
         * Sota - compile state machine definition
         */
        const source = [ ...givenSource, ...config.source.flat(Infinity) ];
        const loadedTargets = await load({ patterns: source, cwd: path.dirname(calledFrom) });
        const targets = { ...givenTargets, ...loadedTargets }
        const machine = await sota.readAll(cliStates, { resolver: SubmachineResolver(targets), argv: true });

        debug('STATE MACHINE DEFINITION', machine);
        print(machine);
        if (PRINT) process.exit(0);

        /**
         * Trajectory - execute state machine
         */
        const resourceCache = new WeakMap();

        const trajectoryResources = new Proxy({}, {
            get(_, name) {
                const cached = resourceCache[name];
                if (cached) return cached;
                return resourceCache[name] = loadResource(targets, name, loaders);
            }
        });

        const trajectoryOptions = {
            reporterOptions: {
                cols: 0,
                quiet: PIPE || QUIET,
                gutterWidth: 12,
                printEvents: {
                    succeed: !PIPE,
                    start: !PIPE && DEBUG,
                    info: !PIPE && VERBOSE,
                    fail: !PIPE && true,
                    error: !PIPE && true,
                    final: PIPE,
                    complete: !PIPE && DEBUG,
                    stdout: !PIPE && true,
                    stderr: !PIPE && true
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
