const filesArray = [
    {
        base: '',
        files: ['homeControl.js', 'package.json', 'LICENSE']
    },
    {
        base: 'www/',
        files: ['index.html', 'index.jsx']
    }];
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
    callback => ssh.exec('[ -d www ] || mkdir www', {
        out: console.log.bind(console),
        err: console.log.bind(console),
        exit: () => {
            if (t) return;
            callback();
            t = true;
        }
    }).start({
        sucess: callback,
        fail: callback
    }),
    callback => {
        console.log('done mkdir');
        var Client = require('scp2').Client;
        var client = new Client(conf);

        async.eachSeries(filesArray, (files, cbb) => async.eachSeries(files.files, (file, cb) => client.upload(files.base + file, conf._HomePath + files.base, cb), cbb),
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
            err: console.log.bind(console)
        }).start({
            sucess: callback,
            fail: callback
        });
    }
], (err) => {
    console.log(err ? err : 'Done');
    process.exit(err ? 1 : 0);
});