const dir = process.env.windir ? './WakeOnLan' : '/home/node/homecontrol/WakeOnLan';
const fs = require('fs');

var hosts;

try {
    hosts = JSON.parse(fs.readFileSync(dir + '/hosts.json'));
}
catch (e) {
    hosts = [];
}

function updateJSON() {
    socket.emit('WakeOnLan:response', {
        type: 'list',
        hosts: hosts
    });
    fs.writeFile(dir + '/hosts.json', JSON.stringify(hosts), (err) => {
        if (err) {
            return log.error(err);
        }
    });
}
const macRegex = /([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})/ig;

var production = !process.env.windir;
const Minilog = require('minilog');
Minilog.pipe(Minilog.backends.console.formatMinilog).pipe(Minilog.backends.console);
const log = Minilog('WakeOnLan \t');

const async = require('async');
const arpscanner = require('arpscan');
const wol = require('wake_on_lan');
const Ping = require('ping');
var io = require('socket.io-client');
var socket = io.connect('http://localhost:' + (production ? '8080' : '80'), {
    reconnect: true,
    reconnectionDelayMax: 1000
});
socket.on('connect', () => {
    log.debug('Connected to homeControl');
    socket.emit('setServerName', 'WakeOnLan');
});
socket.on('WakeOnLan:save', (e) => {
    if (!e || (!e.mac && !e.ip)) return;
    if (!e.name || e.name.length <= 0) {
        e.name = 'Computer ' + (hosts.length + 1);
    }
    if (!e.ip) {
        searchHost(e, (err, ip) => {
            e.ip = ip;
            hosts.push(e);
            log.debug(hosts);
            updateJSON();
        });
    }
    if (!e.mac) {
        searchHost(e, (err, mac) => {
            e.mac = mac;
            hosts.push(e);
            log.debug(hosts);
            updateJSON();
        });
    }
});
socket.on('WakeOnLan:remove', (e) => {
    log.debug(hosts);
    for (var i = 0; i < hosts.length; i++) {
        var item = hosts[i];
        if (!item || (item.mac == e.mac && item.ip == e.ip)) {
            hosts.splice(i, 1);
            i--;
        }
    }
    log.debug(hosts);
    updateJSON();
});
socket.on('WakeOnLan:list', () => {
    socket.emit('WakeOnLan:response', {
        type: 'list',
        hosts: hosts
    });
});
socket.on('WakeOnLan', (e) => {
    log.debug(e);
    e.mac = e.mac ? e.mac.trim().replace(/\.|\-/ig, ':') : '';
    e.ip = undefined;
    if (!e || !e.mac || !e.mac.match(macRegex)) return;

    async.waterfall([
        (callback) => {
            wol.wake(e.mac, (e) => {
                callback(e);
            });
        },
        (callback) => {
            if (!hosts[e.mac]) return searchHost(e, callback);

            callback(null, hosts[e.mac]);
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