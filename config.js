var production = !process.env.windir;

var config = {
    updates: 'dev',
    production: production,
    mongo: 'mongodb://localhost/HomeControl',
    socketPort: process.env.PORT ? process.env.PORT : production ? 8080 : 80,
    RadioPi: {
        speakerPin: 11,
        tvRemote: true
    },
    WakeOnLan: {
        broadcast: '192.168.0.255'
    },
    secret: 'mySecretKey'
};
config.masterSocket = 'http://localhost:' + config.socketPort;

module.exports = config;