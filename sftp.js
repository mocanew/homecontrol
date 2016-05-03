const files = ['homeControl.js', 'package.json', 'LICENSE', 'www/index.html', 'www/index.jsx'];
const dirs = ['RadioPi', 'WakeOnLan', 'build'];
const async = require('async');

const fs = require('fs');
var secure = JSON.parse(fs.readFileSync('sftp.json', 'utf8'));

if (!secure.username || !secure.username.length || !secure.password || !secure.password.length) {
    console.log('No username or password for sftp');
    process.exit(1);
}

var conf = {
    host: 'rontav.go.ro',
    username: secure.username,
    password: secure.password,
    _HomePath: '/home/node/homecontrol/'
};

var SSH = require('simple-ssh');

var ssh = new SSH({
    host: conf.host,
    user: conf.username,
    pass: conf.password,
    baseDir: conf._HomePath
});
var t = false;
async.waterfall([
    callback => ssh.exec('rm -r www && mkdir www', {
        out: console.log.bind(console),
        err: console.log.bind(console),
        exit: (code) => {
            t = true;
            console.log(code);
            if (!t) callback();
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