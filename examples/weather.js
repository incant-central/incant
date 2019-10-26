const weatherJs = require('weather-js');

const weather = ({ location = 'Chicago'}) =>
    new Promise((resolve, reject) =>
        weatherJs.find({ search: location, degreeType: 'F' }, (err, result = []) => {
            if (err) return reject(err);
            const [ first = {} ] = result;
            const { current = {} } = first;
            return resolve(current);
        }));

module.exports = weather;
