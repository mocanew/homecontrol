const macRegex = /([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})/ig;

const Minilog = require('minilog');
Minilog.pipe(Minilog.backends.console.formatMinilog).pipe(Minilog.backends.console);
const log = Minilog('WakeOnLan \t');

const async = require('async');
const arpscanner = require('arpscan');
const wol = require('wake_on_lan');
const Ping = require('ping');
const _ = require('lodash');
const config = require('../config.js');

var io = require('socket.io-client');
var socket = io.connect(config.masterSocket, {
    reconnect: true,
    reconnectionDelayMax: 1000,
    query: 'secret=' + config.secret
});

var hosts = [];
var ComputerModel;

var mongoose = require('mongoose');
mongoose.connect(config.mongo);

var db = mongoose.connection;
db.on('error', e => log.error('DB ERROR:', e));
db.once('open', function () {
    var computerSchema = mongoose.Schema({
        name: String,
        ip: String,
        mac: String,
        image: String
    });
    ComputerModel = mongoose.model('Computers', computerSchema);
});

socket.on('connect', () => {
    log.debug('Connected to homeControl');
    socket.emit('setServerName', 'WakeOnLan');
    sendHosts();
});

function sendHosts(queryDB) {
    if (queryDB !== false) queryDB = true;

    if (queryDB) {
        ComputerModel.find({}, (err, results) => {
            hosts = results;
            socket.emit('WakeOnLan:listResponse', {
                type: 'list',
                hosts: hosts
            });
        });
    }
    else {
        socket.emit('WakeOnLan:listResponse', {
            type: 'list',
            hosts: hosts
        });
    }
}

socket.on('WakeOnLan:save', (e) => {
    if (!e || (!e.mac && !e.ip)) return;
    if (!e.name || e.name.length <= 0) {
        e.name = 'Computer ' + (hosts.length + 1);
    }
    e.mac = e.mac.toUpperCase();
    if (!e.ip) {
        searchHost(e, (err, ip) => {
            e.ip = ip;
            if (!e.ip) delete e.ip;
            new ComputerModel(e).save(sendHosts);
        });
    }
    else if (!e.mac) {
        searchHost(e, (err, mac) => {
            e.mac = mac;
            if (!e.mac) delete e.mac;
            new ComputerModel(e).save(sendHosts);
        });
    }
    else {
        new ComputerModel(e).save(sendHosts);
    }
});

socket.on('WakeOnLan:remove', (e) => {
    if (!e._id) return;

    ComputerModel.remove(e, (err) => {
        if (err) log.error(err);
        sendHosts();
    });
});

socket.on('WakeOnLan:list', () => sendHosts(false));

socket.on('WakeOnLan', (e) => {
    log.debug(e);
    e.mac = e.mac ? e.mac.trim().replace(/\.|\-/ig, ':') : '';
    e.ip = undefined;
    if (!e || !e.mac || !e.mac.match(macRegex)) return;

    async.waterfall([
        (callback) => {
            wol.wake(e.mac, {
                address: config.WakeOnLan.broadcast
            }, (err) => {
                callback(err);
            });
        },
        (callback) => {
            var ip = _.find(hosts, { mac: e.mac }).ip;
            if (!ip) return searchHost(e, callback);

            callback(null, ip);
        },
        ping
    ], (err, result) => {
        if (err || !result) return log.error(err);

        log.debug('WOL', {
            type: 'wol',
            mac: e.mac,
            ip: result.ip,
            isAlive: result.alive
        });
        socket.emit('WakeOnLan:response', {
            type: 'wol',
            mac: e.mac,
            ip: result.ip,
            isAlive: result.alive
        });
    });
});

socket.on('WakeOnLan:ping', (e) => {
    e.mac = e.mac ? e.mac.trim().replace(/\.|\-/ig, ':') : '';
    e.ip = e.ip ? e.ip.trim() : '';
    if (!e || ((!e.mac || !e.mac.match(macRegex)) && !e.ip)) return;

    async.waterfall([
        (callback) => {
            e.ip = e.ip ? e.ip : hosts[e.mac];
            if (!e.mac && !e.ip) return searchHost(e, callback);
            callback(null, e.ip);
        },
        ping
    ], (err, result) => {
        if (err || !result) return log.error(err);

        socket.emit('WakeOnLan:response', {
            type: 'check',
            mac: e.mac,
            ip: result.ip,
            isAlive: result.alive
        });
    });
});

function searchHost(options, callback) {
    if (!options.mac && !options.ip) return callback(true);
    options.mac = options.mac && options.mac.length > 0 ? options.mac : undefined;
    options.ip = options.ip && options.ip.length > 0 ? options.ip : undefined;

    var callbackSent = false;
    arpscanner((err, res) => {
        if (err || !res) {
            if (!callbackSent) {
                callbackSent = true;
                return callback(err, false);
            }
            return;
        }

        for (var i = 0; i < res.length; i++) {
            if (options.mac && res[i].mac == options.mac) return callback(null, res[i].ip);
            if (options.ip && res[i].mac == options.ip) return callback(null, res[i].mac);
        }
    });
}

function ping(ip, callback) {
    if (!ip) return callback('Ping received empty ip address');

    Ping.promise.probe(ip, {
        timeout: 5
    }).then(function (t) {
        t.ip = ip;
        callback(null, t);
    });
}