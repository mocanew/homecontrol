var production = !process.env.windir;
const Minilog = require('minilog');
Minilog.pipe(Minilog.backends.console.formatMinilog).pipe(Minilog.backends.console);
const log = Minilog('HomeControl \t');

const async = require('async');
const dir = process.cwd();
var io = require('socket.io');

const express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => res.sendFile(dir + '/www/index' + (production ? '' : '-debug') + '.html'));
app.get('/index.jsx', (req, res) => res.sendFile(dir + '/www/index.jsx'));

app.use('/images/', express.static(dir + '/www/images/'));
app.use('/assets/', express.static(dir + '/assets/'));
app.get('*', function (req, res) {
    res.redirect('/');
});

var server = app.listen((process.env.PORT ? process.env.PORT : production ? 8080 : 80), function () {
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
function redirect(servers, socket) {
    async.forEachOf(servers, (value, server) => {
        async.each(value, (event) => {
            socket.on(event, (e) => {
                if (socket.name) return;

                messageToServer({
                    server: server,
                    name: event,
                    data: e
                });
            });
        });
    });
}
var redirects = {
    'WakeOnLan': ['WakeOnLan', 'WakeOnLan:list', 'WakeOnLan:ping', 'WakeOnLan:save', 'WakeOnLan:remove'],
    'Radio': ['Radio:start', 'Radio:stop', 'Radio:prev', 'Radio:next', 'Radio:toggle', 'Radio:volume', 'Radio:state:request']
};
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

        socket.on('WakeOnLan:response', (e) => {
            io.to('clients').emit('WakeOnLan:response', e);
        });
        socket.on('WakeOnLan:listResponse', (e) => {
            io.to('clients').emit('WakeOnLan:listResponse', e);
        });

        socket.on('Radio:state', (e) => io.to('clients').emit('Radio:state', e));
        socket.on('Radio:stations', (e) => io.to('clients').emit('Radio:stations', e));
    });
    redirect(redirects, socket);
});