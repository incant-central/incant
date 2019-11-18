'use strict';

const execa = require('execa');
const { spawn } = require('child_process');
const { jitInstall } = require('../install');

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
        return await jitInstall(scoped, { allowDeprecated: explicit });
    },

    async npm(name, main) {
        return await jitInstall(main, { allowDeprecated: true });
    }

};

resolvers.i = resolvers.incant;
resolvers.sh = resolvers.shell;

module.exports = resolvers;
