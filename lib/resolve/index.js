'use strict';

const requireg = require('requireg');
const resolveGlobal = require('resolve-global');
const { debug } = require('../debug');
const { jitInstall } = require('../install');
const builtInLoaders = require('./loaders');
const kinds = new Set(Object.keys(builtInLoaders));

function Resolve({ tasks, loaders }) {

    async function attemptExternalResolve(taskName) {
        let [ main, ...input ] = taskName.split('.');
        const explicit = main.includes('/');
        let kind = 'shell';

        if (explicit) {
            kind = main.slice(0, main.indexOf('/'));
            main = main.slice(kind.length + 1);
        }

        try {
            const loader = await resolveLoader(kind, loaders);
            return await loader({ spec: main, input }, { Resource: taskName, explicit });
        } catch (e) {
            if (e.code === 'DEPRECATED' || explicit) throw e;
            const scoped = `@incant/${main}`;
            return await jitInstall(scoped, { allowDeprecated: false });
        }
    }

    async function resolveTask(taskName) {
        if (tasks[taskName]) return tasks[taskName];
        let key = taskName;
        while (key.includes('.')) {
            key = key.split('.').slice(0, -1).join('.');
            if (tasks[key] != null) return tasks[key];
        }
        return await attemptExternalResolve(taskName);
    }

    async function resolveLoader(kind) {
        if (kinds.has(kind)) return builtInLoaders[kind];
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

    async function resolveResource(taskName) {
        let fn;

        const task = await resolveTask(taskName);

        if (task != null && task.kind) {
            const { kind } = task;
            const loader = await resolveLoader(kind, loaders);
            fn = await loader(task);
        } else {
            fn = task;
        }

        return fn;
    }

    async function submachineResolver(taskName) {
        const t = await resolveResource(taskName);
        if (t.StartAt) return t;
        return taskName;
    }

    return {
        resolveResource,
        submachineResolver
    };
}

module.exports = {
    Resolve
};
