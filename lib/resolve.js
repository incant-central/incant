'use strict';

const requireg = require('requireg');
const execa = require('execa');
const resolveGlobal = require('resolve-global');
const { debug } = require('./debug');
const { jitInstall } = require('./install');

async function resolveTarget(targets, name) {
    if (targets[name]) return targets[name];
    let n = name;
    while (n.includes('.')) {
        n = n.split('.').slice(0, -1).join('.');
        if (targets[n] != null) return targets[n];
    }
    const scoped = `@incant/${name.split('.').shift()}`;
    try {
        return jitInstall(scoped);
    } catch {
        throw new Error(`Unable to resolve target ${name}`);
    }
}

async function loadResource(targets, name, loaders) {
    let loader;
    let fn;

    const target = await resolveTarget(targets, name);

    if (target != null && target.kind) {
        const { kind } = target;
        if (typeof loaders[kind] == 'function') {
            loader = loaders[kind];
        } else {
            try {
                const scoped = `@incant/${kind}-loader`;
                loader = await jitInstall(scoped);
            } catch (e) {
                throw new Error(`${kind} is not a valid loader  - ${e.message}`);
            }
        }
        fn = await loader(target);
    } else {
        fn = target;
    }

    return fn;
}

function SubmachineResolver(targets) {
    return async function resolver(name) {
        const t = await resolveTarget(targets, name);
        if (t.StartAt) return t;
        return name;
    }
}

module.exports = {
    resolveTarget,
    loadResource,
    SubmachineResolver,
    jitInstall
};
