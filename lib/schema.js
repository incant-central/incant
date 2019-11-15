'use strict';

const Joi = require('@hapi/joi');

const StringToArray = joi => ({
    base: joi.array(),
    name: 'stringToArray',
    coerce (value, state, options) { /* eslint-disable-line */
        return typeof value === 'string' ? [ value ]
            : Array.isArray(value)       ? value.flat(Infinity)
            :                              value;
    }
});

const {
    any,
    object,
    string,
    boolean,
    number,
    array,
    func,
    stringToArray
} = Joi.extend([ StringToArray ]).bind();

const source = stringToArray().default([]).items(string()).options({ convert: true });

exports.optionsSchema = object({
    name: string(),
    argv: array().items(string()),
    targets: object(),
    source,
    loaders: array().items(func()),
    __Answers__: func()
});

exports.configSchema = object({
    _: array().items(string().regex(/[^-.].*/), boolean(), number()),
    '--': array().items(string()),
    source,
    input: any(),
    quiet: boolean(),
    q: boolean(),
    verbose: boolean(),
    v: boolean(),
    debug:  [ boolean(), string() ],
    print: [ boolean(), string() ],
    pipe: boolean(),
    install: [ boolean(), string() ]
});
