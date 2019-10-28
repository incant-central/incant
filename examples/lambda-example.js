'use strict';

const AWS = require('aws-sdk');

function lambdaExample({
    fn = 'mho-hello-world',
    payload = {}
}) {
    const lambda = new AWS.Lambda({
        apiVersion: '2015-03-31',
        region: 'us-east-1'
    });
    return new Promise((resolve, reject) => lambda.invoke({
        FunctionName: fn,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(payload)
    }, (err, data) => err ? reject(err) : resolve(JSON.parse(data.Payload).body)));
}

module.exports = lambdaExample;
