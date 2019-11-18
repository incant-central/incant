'use strict';

const requireg = require('requireg');
const resolveGlobal = require('resolve-global');
const { debug } = require('../debug');
const { jitInstall } = require('../install');
const resolvers = require('./resolvers');

const kinds = Object.keys(resolvers);

async function attemptExternalResolve(name) {
    const [ main, ...rest ] = name.split('.');
    try {
        let i = 0;
        while (i < kinds.length) {
            let kind = kinds[i++];
            if (main.startsWith(`${kind}/`)) return await resolvers[kind](name, main.slice(kind.length + 1), rest, { explicit: true });
        }
        return await resolvers.shell(name, main, rest);
    } catch (e) {
        if (e.code === 'DEPRECATED') throw e;
        return await resolvers.incant(name, main, rest);
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

async function loadResource(tasks, name, loaders) {
    let loader;
    let fn;

    const task = await resolveTask(tasks, name);

    if (task != null && task.kind) {
        const { kind } = task;
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
