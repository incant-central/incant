'use strict';

function handleError(e) {
    if (e.name === 'ValidationError') {
        console.error(`Validation Errors:\n${e.details.map(d => `  • ${d.message}`).join('\n')}\n`);
        console.error(e.annotate());
    } else {
        console.error(e && e.message ? e.message : e);
        e && e.stack && console.error(e.stack);
    }
    process.exit(1);
}

module.exports = { handleError };
