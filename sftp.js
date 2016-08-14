const filesArray = [
    {
        base: '',
        files: ['homeControl.js', 'package.json', 'LICENSE']
    },
    {
        base: 'www/',
        files: ['index.html']
    }];
const dirs = ['models', 'routes', 'RadioPi', 'WakeOnLan', 'assets', 'www/images'];
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
    baseDir: '/var/homecontrol/'
};

var ssh = require('ssh2').Client();
var Client = require('scp2').Client;
var client = new Client(conf);

async.waterfall([
    callback => client.mkdir(conf.baseDir + 'www', callback),
    callback => {
        console.log('done mkdir');

        async.eachSeries(filesArray, (files, cbb) => async.eachSeries(files.files, (file, cb) => client.upload(files.base + file, conf.baseDir + files.base, cb), cbb),
            (err) => {
                console.log(err ? err : 'Files uploaded');
                callback(err);
            });
    },
    callback => {
        var highClient = require('scp2');

        async.eachSeries(dirs, (dir, cb) => highClient.scp(dir, conf.username + ':' + conf.password + '@' + conf.host + ':' + conf.baseDir + dir, cb),
            (err) => {
                console.log(err ? err : 'Folders uploaded');
                callback(err);
            });
    },
    callback => {
        ssh.on('ready', () => {
            ssh.exec(`cd ${conf.baseDir} && npm run production`, (err, stream) => {
                stream.on('close', () => callback());
                stream.on('data', data => console.log(data.toString()));
                stream.stderr.on('data', data => console.log(data.toString()));
            });
        }).connect(conf);
    }
], (err) => {
    ssh.end();
    console.log(err ? err : 'Done');
    process.exit(err ? 1 : 0);
});