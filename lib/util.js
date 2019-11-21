'use strict';

const constants = require('./constants');

function isPromise(obj) {
    return !!obj &&
        (typeof obj === 'object' || typeof obj === 'function') &&
        typeof obj.then === 'function';
}

function isReadableStream(stream) {
    return stream !== null &&
        typeof stream === 'object' &&
        typeof stream.pipe === 'function' &&
        stream.readable !== false &&
        typeof stream._read === 'function' &&
        typeof stream._readableState === 'object';
}

function prefixOptions(argv) {
    return argv.reduce((acc, arg) => {
        const { done, a } = acc;
        if (/^--$/.test(arg)) return { done: true, a: [ ...a, arg ] };
        if (!done && /^--.*/.test(arg)) arg = `--input.${arg.slice(2)}`;
        return { done, a: [ ...a, arg ] };
    }, { done: false, a: [] }).a;
}

function setEnv(config) {
    const DEBUG = config.debug;
    const PRINT = config.print;
    const VERBOSE = config.v || config.verbose;
    const QUIET = config.q || config.quiet;
    const PIPE = config.p || config.pipe;
    const INSTALL = config.install;

    if (DEBUG) process.env[constants.DEBUG] = DEBUG;
    if (PRINT) process.env[constants.PRINT] = PRINT;
    if (VERBOSE) process.env[constants.VERBOSE] = VERBOSE;
    if (QUIET) process.env[constants.QUIET] = QUIET;
    if (PIPE) process.env[constants.PIPE] = PIPE;
    if (INSTALL) process.env[constants.INSTALL] = INSTALL;

    return {
        DEBUG,
        PRINT,
        VERBOSE,
        QUIET,
        PIPE,
        INSTALL
    };
}

const isPlainObj = v =>
    Object.prototype.toString.call(v) === '[object Object]';

const mergeWithDefault = (v, d) =>
    d == null                     ? JSON.stringify(v)
  : [ d, v ].every(Array.isArray) ? [ ...d, ...v ]
  : [ d, v ].every(isPlainObj)    ? { ...d, ...v }
  :                                 v;

function parsePath(data, path) {
    const [ key, ...nextPath ] = path;
    try {
        const result = JSON.parse(data[key]);
        return nextPath.length
            ? parsePath(result, nextPath)
            : result;
    } catch (e) {
        return data;
    }
}

const orDefault = (v, d) =>
    v === null
        ? d
        : v;

module.exports = {
    isPromise,
    isReadableStream,
    prefixOptions,
    setEnv,
    isPlainObj,
    mergeWithDefault,
    parsePath,
    orDefault
};
