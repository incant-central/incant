'use strict';

const AWS = require('aws-sdk');

function AwsLambdaLoader(definition) {
    const {
        spec
    } = definition;

    const {
        fn,
        region = 'us-east-1',
        type = 'RequestResponse'
    } = spec;

    if (typeof fn != 'string') throw new Error('invalid lambda function');

    function awsLambdaTarget(payload = {}, { name:cmdPath }) {
        const lambda = new AWS.Lambda({
            apiVersion: '2015-03-31',
            region
        });
        return new Promise((resolve, reject) => lambda.invoke({
            FunctionName: fn,
            InvocationType: type,
            Payload: JSON.stringify(payload)
        }, (err, data) => {
            let response;
            let body;
            try {
                response = JSON.parse(data.Payload);
                try {
                    body = JSON.parse(response.body);
                } catch {
                    body = response.body;
                }
            } catch (e) {
                return reject(e);
            }
            return err
                ? reject(err)
                : resolve(body);
        }))
    }

    return awsLambdaTarget;
}

module.exports = AwsLambdaLoader;