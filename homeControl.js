var production = !process.env.windir;
const Minilog = require('minilog');
Minilog.pipe(Minilog.backends.console.formatMinilog).pipe(Minilog.backends.console);
const log = Minilog('HomeControl \t');

const dir = process.cwd();
var io = require('socket.io');

const express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => res.sendFile(dir + '/www/index' + (production ? '' : '-debug') + '.html'));
app.get('/index.jsx', (req, res) => res.sendFile(dir + '/www/index.jsx'));

app.use('/assets/', express.static(dir + '/assets/'));
app.get('*', function (req, res) {
    console.log(req);
    res.redirect('/');
});

var server = app.listen((production ? 8080 : 80), function () {
    var host = server.address().address;
    var port = server.address().port;

    log.info('Listening on ', host, port);
});

function messageToServer(options, callback) {
    if (!options || !options.server || !options.name) {
        return;
    }

    if (!servers[options.server]) {
        return setTimeout(messageToServer, 500, options);
    }
    servers[options.server].emit(options.name, options.data);

    if (typeof options.callback == 'function') {
        options.callback();
    }
    if (typeof callback == 'function') {
        callback();
    }
}
io = io(server);
var clients = {};
var servers = {};

io.on('connection', function (socket) {
    clients[socket.id] = socket;
    socket.join('clients');

    socket.on('disconnect', () => {
        if (clients[socket.id]) {
            delete clients[socket.id];
        }
        else if (socket.name) {
            log.warn('Lost connection with ' + socket.name);
            delete servers[socket.name];
        }
    });

    socket.on('setServerName', (e) => {
        socket.name = e;
        delete clients[socket.id];
        servers[socket.name] = socket;
        socket.emit('requestState');
        socket.join('servers');
        socket.leave('clients');

        ping();
    });

    socket.on('WakeOnLan', (e) => messageToServer({
        server: 'WakeOnLan',
        name: 'WakeOnLan',
        data: e
    }));
    socket.on('WakeOnLan:list', () => messageToServer({
        server: 'WakeOnLan',
        name: 'WakeOnLan:list'
    }));
    socket.on('WakeOnLan:ping', (e) => messageToServer({
        server: 'WakeOnLan',
        name: 'WakeOnLan:ping',
        data: e
    }));
    socket.on('WakeOnLan:response', (e) => {
        io.to('clients').emit('WakeOnLan:response', e);
    });

    socket.on('Radio:start', (e) => messageToServer({
        server: 'Radio',
        name: 'Radio:start',
        data: e
    }));
    socket.on('Radio:stop', () => messageToServer({
        server: 'Radio',
        name: 'Radio:stop'
    }));
    socket.on('Radio:prev', () => messageToServer({
        server: 'Radio',
        name: 'Radio:prev'
    }));
    socket.on('Radio:next', () => messageToServer({
        server: 'Radio',
        name: 'Radio:next'
    }));
    socket.on('Radio:toggle', (e) => messageToServer({
        server: 'Radio',
        name: 'Radio:toggle',
        data: e
    }));
    socket.on('Radio:volume', (e) => messageToServer({
        server: 'Radio',
        name: 'Radio:volume',
        data: e
    }));
    socket.on('Radio:state:request', () => {
        messageToServer({
            server: 'Radio',
            name: 'Radio:state'
        });
    });
    socket.on('Radio:state', (e) => io.to('clients').emit('Radio:state', e));
    socket.on('Radio:stations', (e) => io.to('clients').emit('Radio:stations', e));
});

var t = 0;
function ping() {
    if (Date.now() - t < 10000) return setTimeout(ping, 100);

    t = Date.now();
    messageToServer({
        server: 'WakeOnLan',
        name: 'check',
        data: {
            mac: '00:25:22:E7:EC:24'
        }
    }, ping);
}