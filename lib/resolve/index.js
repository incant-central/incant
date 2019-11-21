'use strict';

const requireg = require('requireg');
const resolveGlobal = require('resolve-global');
const { debug } = require('../debug');
const { jitInstall } = require('../install');
const resolvers = require('./resolvers');

const kinds = Object.keys(resolvers);

async function attemptExternalResolve(name) {
    const [ main, ...rest ] = name.split('.');
    const hasKind = main.includes('/');
    try {
        if (hasKind) {
            const kind = main.slice(0, main.indexOf('/'));
            const input = main.slice(kind.length + 1);
            if (typeof resolvers[kind] !== 'function') throw new Error(`Unknown kind: ${kind}`);
            return await resolvers[kind](input, { Resource: name, explicit: true });
        } else {
            return await resolvers.shell(main, { Resource: name });
        }
    } catch (e) {
        if (e.code === 'DEPRECATED' || hasKind) throw e;
        return await resolvers.incant(main, { Resource: name });
    }
}

async function resolveTask(tasks, name) {
    if (tasks[name]) return tasks[name];
    let key = name;
    while (key.includes('.')) {
        key = key.split('.').slice(0, -1).join('.');
        if (tasks[key] != null) return tasks[key];
    }
    return await attemptExternalResolve(name);
}

async function resolveLoader(kind, loaders) {
    let loader;
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
    return loader;
}

async function loadResource(tasks, name, loaders) {
    let fn;

    const task = await resolveTask(tasks, name);

    if (task != null && task.kind) {
        const { kind } = task;
        const loader = resolveLoader(kind, loaders);
        fn = await loader(task);
    } else {
        fn = task;
    }

    return fn;
}

function SubmachineResolver(tasks) {
    return async function resolver(name) {
        const t = await resolveTask(tasks, name);
        if (t.StartAt) return t;
        return name;
    }
}

module.exports = {
    resolveTask,
    loadResource,
    SubmachineResolver,
    jitInstall
};
