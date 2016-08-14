const Minilog = require('minilog');
Minilog.pipe(Minilog.backends.console.formatMinilog).pipe(Minilog.backends.console);
const log = Minilog('HomeControl \t');
const config = require('./config.js');

const async = require('async');
const dir = process.cwd();
var io = require('socket.io');
var passportSocketIo = require('passport.socketio');

var passport = require('passport');
var Strategy = require('passport-local').Strategy;

var User = require('./models/user.js');

passport.use(new Strategy((username, password, cb) => {
    User.findOne({
        username: username
    }, (err, user) => {
        if (err) return cb(err);
        if (!user) return cb(null, false, { success: false, message: 'Wrong user' });
        if (!user.isCorrectPassword(password)) return cb(null, false, { success: false, message: 'Wrong password' });

        cb(null, user);
    });
}));
passport.serializeUser((user, cb) => cb(null, user._id));

passport.deserializeUser((id, cb) => {
    User.findOne({
        _id: id
    }, (err, user) => {
        if (err) return cb(err);

        cb(null, user);
    });
});

var session = require('express-session');
const MongoStore = require('connect-mongo')(session);
var sessionStore = new MongoStore({
    url: config.mongo
});
const expressSession = session({
    passport: passport,
    secret: config.secret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore
});

const express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(require('cookie-parser')());
app.use(expressSession);
app.use(passport.initialize());
app.use(passport.session());

var morgan = require('morgan');
app.use(morgan('dev'));

app.get('/', (req, res) => res.sendFile(dir + '/www/index' + (config.production ? '' : '-debug') + '.html'));
app.get('/index.jsx', (req, res) => res.sendFile(dir + '/www/index.jsx'));

app.use('/images/', express.static(dir + '/www/images/'));
app.use('/assets/', express.static(dir + '/assets/'));

app.use('/api/', require('./routes/api.js'));

app.get('*', function (req, res) {
    res.redirect('/');
});

var server = app.listen(config.socketPort, function () {
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
    if (!socket.isServer && (!socket.request.user || !socket.request.user._id)) return;

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
    'Radio': ['Radio:start', 'Radio:stop', 'Radio:prev', 'Radio:next', 'Radio:toggle', 'Radio:volume', 'Radio:state:request', 'Radio:add', 'Radio:remove']
};
var passportSocketioMiddleware = passportSocketIo.authorize({
    secret: config.secret,
    store: sessionStore,
    passport: passport,
    success: (socket, next) => {
        next();
    }
});
io = io(server);
io.use((socket, next) => {
    if (socket.handshake.query) {
        if (socket.handshake.query.secret == config.secret) {
            socket.isServer = true;
            return next();
        }
    }
    passportSocketioMiddleware(socket, next);
});
var clients = {};
var servers = {};

io.on('connection', function (socket) {
    clients[socket.id] = socket;
    socket.join('clients');

    socket.emit('logStatus', true);

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