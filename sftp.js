var files = ['homeControl.js', 'package.json', 'LICENSE', 'www/index.html', 'www/index.jsx'];
var dirs = ['RadioPi', 'WakeOnLan', 'build'];
const async = require('async');

var conf = {
    host: 'rontav.go.ro',
    username: '',
    password: '',
    _HomePath: '/home/node/homecontrol/'
};

var SSH = require('simple-ssh');

var ssh = new SSH({
    host: conf.host,
    user: conf.username,
    pass: conf.password,
    baseDir: conf._HomePath
});

async.waterfall([
    callback => ssh.exec('mkdir www', {
        out: console.log.bind(console),
        err: console.log.bind(console),
        exit: (code) => {
            console.log(code);
            callback();
        }
    }).start(),
    callback => {
        var Client = require('scp2').Client;
        var client = new Client(conf);

        async.eachSeries(files, (file, cb) => client.upload(file, conf._HomePath, cb),
            (err) => {
                console.log(err ? err : 'Files uploaded');
                callback(err);
            });
    },
    callback => {
        var client = require('scp2');

        async.eachSeries(dirs, (dir, cb) => client.scp(dir, conf.username + ':' + conf.password + '@' + conf.host + ':' + conf._HomePath + dir, cb),
            (err) => {
                console.log(err ? err : 'Folders uploaded');
                callback(err);
            });
    },
    callback => {
        ssh.exec('ls ./ && npm install --production && service wakeonlan restart && service radiopi restart && service homecontrol restart', {
            out: console.log.bind(console),
            err: console.log.bind(console),
            exit: (code) => {
                console.log(code);
                callback();
            }
        }).start();
    }
], (err) => {
    console.log(err ? err : 'Done');
    process.exit(err ? 1 : 0);
});