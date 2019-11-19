'use strict';

const execa = require('execa');
const { spawn } = require('child_process');
const { jitInstall } = require('../install');
const { evaluate } = require('../evaluate');
const { inspect } = require('util');
const AWS = require('aws-sdk');

const resolvers = {

    async shell(main, { Resource = '' } = {}) {
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
    },

    async incant(unscoped, { explicit = false } = {}) {
        const scoped = `@incant/${unscoped}`;
        return jitInstall(scoped, { allowDeprecated: explicit });
    },

    async npm(pkg) {
        return jitInstall(pkg, { allowDeprecated: true });
    },

    async js(handler) {
        const handlers = {
            eval: v => evaluate(v),
            log: v => console.log(inspect(v, {colors: true, depth: 3 })),
            stringify: v => JSON.stringify(v)
        };
        if (!handlers[handler]) throw new Error('No matching js handler.');
        return handlers[handler];
    },

    async lambda(fn) {
        if (typeof fn !== 'string') throw new Error('invalid lambda function');

        function awsLambdaTask(payload = {}, { name:cmdPath }) {
            const lambda = new AWS.Lambda({
                apiVersion: '2015-03-31',
                region: 'us-east-1'
            });
            return new Promise((resolve, reject) => lambda.invoke({
                FunctionName: fn,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(payload)
            }, (err, data) => {
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
                return err
                    ? reject(err)
                    : resolve(body);
            }));
        }

        return awsLambdaTask;
    }
};

resolvers.i = resolvers.incant;
resolvers.sh = resolvers.shell;

module.exports = resolvers;
