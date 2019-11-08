'use strict';

const requireg = require('requireg');
const { spawnSync:spawn } = require('child_process');
const resolveGlobal = require('resolve-global');
const { debug } = require('./debug');

function jitInstall(pkgName) {
    try {
        resolveGlobal(pkgName);
        return requireg(pkgName);
    } catch {
        const install = spawn('npm', [ 'install', '--silent', '-g', pkgName ], { encoding: 'utf8', stdio: 'inherit' });
        if (install.status != 0) throw 'unable to install';
        return requireg(pkgName);
    }
}

function resolveTarget(targets, name) {
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

function loadResource(name, target, loaders) {
    let loader;
    let fn;

    if (target != null && target.kind) {
        const { kind } = target;
        if (typeof loaders[kind] == 'function') {
            loader = loaders[kind];
        } else {
            try {
                const scoped = `@incant/${kind}-loader`;
                loader = jitInstall(scoped);
            } catch (e) {
                throw new Error(`${kind} is not a valid loader  - ${e.message}`);
            }
        }
        fn = loader(target);
    } else {
        fn = target;
    }

    return fn;
}

function SubmachineResolver(targets) {
    return function resolver(name) {
        const t = resolveTarget(targets, name);
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
