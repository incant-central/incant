'use strict';

const execa = require('execa');
const { spawn } = require('child_process');
const { jitInstall } = require('../install');
const { evaluate } = require('../evaluate');
const { inspect } = require('util');
const AWS = require('aws-sdk');
const { isPlainObj, mergeWithDefault, parsePath, orDefault } = require('../util');

async function npm({ spec:pkg }) {
    return jitInstall(pkg, { allowDeprecated: true });
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


async function awsLambda({
        spec,
        input:Payload = {}
    }) {
    const {
        FunctionName,
        InvocationType = 'RequestResponse',
        apiVersion = '2015-03-31',
        region = 'us-east-1'
    } = typeof spec === 'string'
        ? {
            FunctionName: spec
          }
        : spec;

    if (typeof FunctionName !== 'string') throw new Error('invalid lambda function');

    const lambda = new AWS.Lambda({ apiVersion, region });

    function awsLambdaTask(payload = {}) {
        Payload = JSON.stringify(mergeWithDefault(payload, Payload));
        return new Promise((resolve, reject) =>

            lambda.invoke({
                FunctionName,
                InvocationType,
                Payload
            }, (err, data) => {
                if (err) return reject(err)
                resolve(parsePath(data, [ 'Payload', 'body' ]));
            }));
    }

    return awsLambdaTask;
}

module.exports = {
    npm,
    incant,
    i: incant,
    shell,
    sh: shell,
    js,
    lambda: awsLambda,
    'aws-lambda': awsLambda
};
