#!/usr/bin/env node

const path = require('path');
const { readAll }  = require('sota');
const { Trajectory } = require('trajectory');
const DefaultAnswers = require('answers');
const callsites = require('callsites');
const builtinLoaders = require('./lib/loaders');

const { inspect } = require('util');
const debug = !!process.env.DEBUG;
const dry_run = !!process.env.DRY_RUN;
const log = (l, v) => (debug || dry_run) && console.log(`${dry_run ? JSON.stringify(v, null, 2) : `${l}\n${inspect(v, { colors: true, depth: null })}`}`);

const { load, sourceExpander } = require('./lib/load');
const { stateSchema, optionsSchema } = require('./lib/schema');
const { prefixOptions } = require('./lib/util');
const { resolveTarget, loadResource, Resolver } = require('./lib/resolve');

async function Incant(options = {}) {
    try {
        const calledFrom = callsites()[1].getFileName();

        const {
            name = 'incant',
            argv = process.argv.slice(2),
            targets:givenTargets = {},
            source:givenSource,
            loaders:customLoaders,
            __Answers__:Answers = DefaultAnswers
        } = await optionsSchema.validate(options);

        process.title = name;

        const prefixedArgv = prefixOptions(argv);
        const rawConfig = await Answers({
            name,
            argv: prefixedArgv,
            loaders: [ sourceExpander ]
        });
        const config = await stateSchema.validate(rawConfig);
        const source = [ ...givenSource, ...config.source ];
        const loadedTargets = await load({ patterns: source, cwd: path.dirname(calledFrom) });
        const targets = source.length
            ? { ...givenTargets, ...loadedTargets }
            : givenTargets;
        const loaders = { ...builtinLoaders, ...customLoaders };

        const definition = config._;
        const resourceCache = new WeakMap();
        const resources = new Proxy({}, {
            get(_, name) {
                return resourceCache[name] || loadResource(name, resolveTarget(targets, name), loaders);
            }
        });
        const machine = await readAll(definition, { resolver: Resolver(targets) });
        log('machine definition:', machine);
        if (dry_run) process.exit(0);
        const t = new Trajectory({
            reporterOptions: {
                cols: 0,
                printLabels: {
                    succeed: true,
                    start: true,
                    info: debug,
                    fail: true,
                    error: true,
                    complete: debug
                },
                printEvents: {
                    succeed: true,
                    start: debug,
                    info: true,
                    fail: true,
                    error: true,
                    complete: debug
                }
            },
            resources,
            debug
        });

        const input = config.input;
        return t.execute(machine, input);

    } catch (e) {
        if (e.name === 'ValidationError') {
            console.error(`Validation Errors:\n${e.details.map(d => `  • ${d.message}`).join('\n')}\n`);
            console.error(e.annotate());
        } else {
            console.error(e && e.message ? e.message : e);
            e && e.stack && console.error(e.stack);
        }
        process.exit(1);
    }
}

if (require.main === module) {
    Incant();
}
