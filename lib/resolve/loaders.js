'use strict';

const execa = require('execa');
const { spawn } = require('child_process');
const { jitInstall } = require('../install');
const { evaluate } = require('../evaluate');
const { inspect } = require('util');
const { isPlainObj, mergeWithDefault, parsePath, orDefault } = require('../util');

async function npm({ spec }) {
    if (spec.includes('::')) {
        const [ pkgName, exportName ] = spec.split('::');
        const pkg = await jitInstall(pkgName, { allowDeprecated: true });
        return pkg[exportName];
    }
    return jitInstall(spec, { allowDeprecated: true });
}

async function incant({ spec:unscoped }, { explicit = false } = {}) {
    const scoped = `@incant/${unscoped}`;
    return jitInstall(scoped, { allowDeprecated: explicit });
}

async function shell({ spec: main, input = [] }, { Resource }) {
    const { exitCode } = await execa('which', [ main ], { reject: false });
    if (exitCode === 0) {
        return (args, { onCancel }) => {
            args = typeof args === 'string'
                ? [ args ]
                : args;
            if (![ args, input ].every(Array.isArray)) throw new Error(`Invalid input for ${main}`);
            const spawned = spawn(main, [ ...input, ...args ], { stdio: 'pipe', maxBuffer: 100000000 });
            onCancel(() => spawned.kill());
            return spawned;
        };
    }
    throw new Error(`Unable to resolve task ${Resource}`);
}

async function js({
    spec:handler,
    input
}) {
    const jsHandlers = {
        eval: v => evaluate(orDefault(v, input)),
        log: v => (console.log(inspect(orDefault(v, input), { colors: true, depth: 3 })), v),
        stringify: v => JSON.stringify(orDefault(v, input))
    };
    if (!jsHandlers[handler]) throw new Error('No matching js handler.');
    return jsHandlers[handler];
}

module.exports = {
    npm,
    incant,
    i: incant,
    shell,
    sh: shell,
    js
};
