const ips = {
    '00:25:22:E7:EC:24': '192.168.0.100'
};
const macRegex = /([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})/ig;

const Minilog = require('minilog');
Minilog.pipe(Minilog.backends.console.formatMinilog).pipe(Minilog.backends.console);
const log = Minilog('WakeOnLan \t');

const async = require('async');
const arpscanner = require('arpscan');
const wol = require('wake_on_lan');
const Ping = require('ping');
var io = require('socket.io-client');
var socket = io.connect('http://localhost', {
    reconnect: true,
    reconnectionDelayMax: 1000
});
socket.on('connect', () => {
    log.debug('Connected to homeControl');
    socket.emit('setServerName', 'WakeOnLan');
});
socket.on('WakeOnLan:list', () => {
    socket.emit('WakeOnLan:response', {
        type: 'list',
        ips: ips
    });
});
socket.on('WakeOnLan', (e) => {
    log.debug(e);
    e.mac = e.mac ? e.mac.trim().replace(/\.|\-/ig, ':') : '';
    if (!e || !e.mac || !e.mac.match(macRegex)) return;

    async.waterfall([
        (callback) => {
            wol.wake(e.mac, (e) => {
                callback(e);
            });
        },
        (callback) => {
            if (!ips[e.mac]) return searchHost(e.mac, callback);

            callback(null, ips[e.mac]);
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
            var ip = e.ip ? e.ip : ips[e.mac];
            if (!e.mac && !ip) return searchHost(e.mac, callback);
            callback(null, ip);
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

function searchHost (mac, callback) {
    log.debug('Unknown mac address,', mac);
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
            if (res[i].mac == mac) return callback(null, res[i].ip);
        }
    });
}
function ping (ip, callback) {
    if (!ip) return callback('Ping received empty ip address');

    Ping.promise.probe(ip, {
        timeout: 5
    }).then(function (t) {
        t.ip = ip;
        callback(null, t);
    });
}