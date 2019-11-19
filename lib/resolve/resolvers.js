'use strict';

const execa = require('execa');
const { spawn } = require('child_process');
const { jitInstall } = require('../install');
const { evaluate } = require('../evaluate');
const { inspect } = require('util');

const resolvers = {

    async shell(name, main, rest) {
        const { exitCode } = await execa('which', [ main ], { reject: false });
        if (exitCode === 0) {
            return (args, { onCancel }) => {
                args = typeof args === 'string' ? [ args ] : args;
                if (!Array.isArray(args)) throw new Error(`Invalid input for ${name}`);
                const spawned = spawn(main, [ ...rest, ...args], { stdio: 'pipe', maxBuffer: 100000000 });
                onCancel(() => spawned.kill());
                return spawned;
            };
        }
        throw new Error(`Unable to resolve task ${name}`);
    },

    async incant(name, main, rest, { explicit = false } = {}) {
        const scoped = `@incant/${main}`;
        return jitInstall(scoped, { allowDeprecated: explicit });
    },

    async npm(name, main) {
        return jitInstall(main, { allowDeprecated: true });
    },

    async js(name, main, rest) {
        const handlers = {
            eval: v => evaluate(v),
            log: v => console.log(inspect(v, {colors: true, depth: 3 })),
            stringify: v => JSON.stringify(v)
        };
        if (!handlers[main]) throw new Error('No matching js handler.');
        return handlers[main];
    }

};

resolvers.i = resolvers.incant;
resolvers.sh = resolvers.shell;

module.exports = resolvers;
