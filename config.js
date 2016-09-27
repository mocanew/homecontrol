var _ = require('lodash');

var defaults = {
    updates: 'production',
    production: true,
    mongo: 'mongodb://localhost/HomeControl',
    port: 8080,
    RadioPi: {
        speakerPin: 11,
        tvRemote: true
    },
    WakeOnLan: {
        broadcast: '192.168.0.255'
    },
    secret: 'mySecretKey'
};

var config = {};

try {
    config = require('./config.json');

    if (!process.env.browser) {
        config.secret = require('./secret.json').secret;
    }
}
catch (e) {
    console.error('Config or secret file is invalid');
}
config = _.merge(defaults, config);
config.socketURL = 'http://localhost:' + config.port;

if (process.env.browser) {
    delete config.secret;
    delete config.mongo;
}

module.exports = config;