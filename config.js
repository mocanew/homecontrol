var production = !process.env.windir;

var config = {
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
    secret: 'mySecretKey',
    permissions: {
        user: 0,
        admin: 9
    }
};
config.masterSocket = 'http://localhost:' + config.socketPort;

module.exports = config;