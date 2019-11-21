'use strict';

const execa = require('execa');
const { spawn } = require('child_process');
const { jitInstall } = require('../install');
const { evaluate } = require('../evaluate');
const { inspect } = require('util');
const AWS = require('aws-sdk');

async function npm(pkg) {
    return jitInstall(pkg, { allowDeprecated: true });
}


async function incant(unscoped, { explicit = false } = {}) {
    const scoped = `@incant/${unscoped}`;
    return jitInstall(scoped, { allowDeprecated: explicit });
}

async function shell(main, { Resource = '' } = {}) {
    const [ _, ...givenArgs ] = Resource.split('.');
    const { exitCode } = await execa('which', [ main ], { reject: false });
    if (exitCode === 0) {
        return (args, { onCancel }) => {
            args = typeof args === 'string'
                ? [ args ]
                : args;
            if (!Array.isArray(args)) throw new Error(`Invalid input for ${main}`);
            const spawned = spawn(main, [ ...givenArgs, ...args ], { stdio: 'pipe', maxBuffer: 100000000 });
            onCancel(() => spawned.kill());
            return spawned;
        };
    }
    throw new Error(`Unable to resolve task ${Resource}`);
}

async function js(handler) {
    const handlers = {
        eval: v => evaluate(v),
        log: v => console.log(inspect(v, {colors: true, depth: 3 })),
        stringify: v => JSON.stringify(v)
    };
    if (!handlers[handler]) throw new Error('No matching js handler.');
    return handlers[handler];
}

async function awsLambda(FunctionName) {
    if (typeof FunctionName !== 'string') throw new Error('invalid lambda function');

    const InvocationType = 'RequestResponse';

    const lambda = new AWS.Lambda({
        apiVersion: '2015-03-31',
        region: 'us-east-1'
    });

    function awsLambdaTask(payload = {}) {
        const Payload = JSON.stringify(payload);

        return new Promise((resolve, reject) =>
            lambda.invoke({
                FunctionName,
                InvocationType,
                Payload
            }, (err, data) => {
                if (err) return reject(err)
                let response;
                let body;
                try {
                    response = JSON.parse(data.Payload);
                    try {
                        body = JSON.parse(response.body);
                    } catch {
                        body = response;
                    }
                } catch (e) {
                    return reject(e);
                }
                return resolve(body);
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
