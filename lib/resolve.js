'use strict';

const requireg = require('requireg');
const execa = require('execa');
const resolveGlobal = require('resolve-global');
const { debug } = require('./debug');
const { jitInstall } = require('./install');
const { spawn } = require('child_process');

const deprecated = [ 'git', 'npm', 'ls', 'docker' ];

async function resolveTask(tasks, name) {
    if (tasks[name]) return tasks[name];
    let n = name;
    while (n.includes('.')) {
        n = n.split('.').slice(0, -1).join('.');
        if (tasks[n] != null) return tasks[n];
    }
    const main = name.split('.').shift();
    const scoped = `@incant/${main}`;
    try {

        // this is temporary hack to get around @incant/git and other shellspec stuff that we don't need anymore
        if (deprecated.includes(main)) throw new Error();

        return await jitInstall(scoped);
    } catch {
        const { exitCode } = await execa('which', [ main ]);
        if (exitCode === 0) {
            const parts = name.split('.');
            const subs = parts.length > 1
                ? parts.slice(1)
                : [];
            return (args, { onCancel }) => {
                args = typeof args === 'string' ? [ args ] : args;
                if (!Array.isArray(args)) throw new Error(`Invalid input for ${name}`);
                const spawned = spawn(main, [ ...subs, ...args], { stdio: 'pipe', maxBuffer: 100000000 });
                onCancel(() => spawned.kill());
                return spawned;
            };
        }
        throw new Error(`Unable to resolve task ${name}`);
    }
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
