'use strict';

const requireg = require('requireg');
const resolveGlobal = require('resolve-global');
const { debug } = require('../debug');
const { jitInstall } = require('../install');
const resolvers = require('./resolvers');

const kinds = Object.keys(resolvers);

async function attemptExternalResolve(name) {
    const [ main, ...rest ] = name.split('.');
    const explicit = main.includes('/');

    let kind = 'shell';
    let input = main;

    if (explicit) {
        kind = main.slice(0, main.indexOf('/'));
        input = main.slice(kind.length + 1);
    }

    if (typeof resolvers[kind] !== 'function') throw new Error(`Unknown kind: ${kind}`);

    let loader = resolvers[kind];

    try {
        return await loader(input, { Resource: name, explicit });
    } catch (e) {
        if (e.code === 'DEPRECATED' || explicit) throw e;
        return await resolvers.incant(input, { Resource: name, explicit: false });
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
    let createError = e => new Error(`${kind} is not a valid loader ${e && e.message ? ` - ${e.message}` : ''}`);

    if (typeof loaders[kind] === 'function') {
        loader = await loaders[kind];
    } else {
        try {
            const scoped = `@incant/${kind}-loader`;
            loader = await jitInstall(scoped);
        } catch (e) {
            throw createError(e);
        }
    }

    if (typeof loader !== 'function') throw createError();

    return loader;
}

async function loadResource(tasks, name, loaders) {
    let fn;

    const task = await resolveTask(tasks, name);

    if (task != null && task.kind) {
        const { kind } = task;
        const loader = await resolveLoader(kind, loaders);
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
