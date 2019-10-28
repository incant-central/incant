'use strict';

function lambdaExample({
    fn = 'mho-hello-world',
    payload = {},
    region = 'us-east-1',
    type = 'RequestResponse'
}) {
    const lambda = new global.AWS.Lambda({
        apiVersion: '2015-03-31',
        region
    });
    return new Promise((resolve, reject) => lambda.invoke({
        FunctionName: fn,
        InvocationType: type,
        Payload: JSON.stringify(payload)
    }, (err, data) => err ? reject(err) : resolve(JSON.parse(data.Payload).body)));
}

module.exports = lambdaExample;
