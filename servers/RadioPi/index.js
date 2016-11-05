const lirc = require('lirc_node');
const io = require('socket.io-client');
const Minilog = require('minilog');
Minilog.pipe(Minilog.backends.console.formatMinilog).pipe(Minilog.backends.console);
const log = Minilog('RadioPi \t');
const MPlayer = require('mplayer');
const async = require('async');
const _ = require('lodash');
const config = require('../../config.js');
const mongoose = require('mongoose');

var gpio, player;
try {
    gpio = require('rpi-gpio');
    if (!_.isUndefined(process.env.nogpio)) throw 'No GPIO';
}
catch (er) {
    gpio = null;
}
try {
    player = new MPlayer();
}
catch (er) {
    player = null;
}
var state = {
    lastPlayed: 0,
    playing: false,
    volume: 100,
    expectedToStop: false,
    stopping: false
};
var RadioModel = require('../../models/radioStation.js');

socket = io.connect(config.socketURL, {
    reconnect: true,
    reconnectionDelayMax: 1000,
    query: 'secret=' + config.secret
});
socket.on('connect', () => {
    log.debug('Connected to homeControl');
    socket.emit('setServerName', 'Radio');
});

async.waterfall([
    (callback) => {
        var db = mongoose.connection;
        db.once('open', () => callback());
    },
    () => {
        if (gpio) {
            gpio.setup(config.RadioPi.speakerPin, gpio.DIR_OUT, startup);
        }
        else {
            startup();
        }
    }
]);

function startup() {
    if (player) {
        player.on('stop', () => {
            if (state.expectedToStop) {
                state.expectedToStop = false;
                return;
            }

            updateGPIO(config.RadioPi.speakerPin, false);
            sendState(false);
            log.info('Mplayer stopped');
            log.debug(state);
        });
        player.on('start', () => {
            updateGPIO(config.RadioPi.speakerPin, true);

            sendState(false);
            log.info('Start radio', state.stations[state.lastPlayed].name);
        });
        player.on('status', () => {
            log.debug('MPlayer status:', player.status);
            state.title = player.status.title;
            sendState(false);
        });
    }

    if (gpio && config.RadioPi.tvRemote) {
        var t = Date.now();
        var throttleExceptions = ['KEY_VOLUMEDOWN', 'KEY_VOLUMEUP', 'KEY_DOWN', 'KEY_UP'];
        lirc.init();
        lirc.addListener((data) => {
            if (!data || !data.key || !data.repeat) return;
            if (Date.now() - t < 500 && throttleExceptions.indexOf(data.key) == -1) return;
            t = Date.now();

            switch (data.key) {
                case 'KEY_POWER':
                case 'KEY_OK':
                    toggleRadio();
                    break;
                case 'KEY_VOLUMEUP':
                case 'KEY_UP':
                    changeVolume('+');
                    break;
                case 'KEY_VOLUMEDOWN':
                case 'KEY_DOWN':
                    changeVolume('-');
                    break;
                case 'KEY_CHANNELUP':
                case 'KEY_RIGHT':
                    startRadio(nextStation());
                    break;
                case 'KEY_CHANNELDOWN':
                case 'KEY_LEFT':
                    startRadio(previousStation());
                    break;
            }
        });
    }

    socket.on('Radio:start', startRadio);
    socket.on('Radio:next', () => startRadio(nextStation()));
    socket.on('Radio:prev', () => startRadio(previousStation()));
    socket.on('Radio:stop', stopRadio);
    socket.on('Radio:volume', changeVolume);
    socket.on('Radio:toggle', toggleRadio);
    socket.on('Radio:replaceStations', (newStations) => {
        var removedStations = state.stations;
        newStations.forEach((station) => {
            var key = _.findKey(state.stations, (sta) => {
                return sta._id == station._id;
            });
            if (key) {
                removedStations.splice(key, 1);
            }
            updateStation(station);
        });
        removedStations.forEach((station) => removeStation(station));
    });
    socket.on('Radio:state:request', () => sendState(true));
    socket.on('requestState', () => sendState(true));

    updateGPIO(config.RadioPi.speakerPin, false);
    sendState();
    log.info('Startup completed');
}
function updateStation(station) {
    if (!station.name || !station.url) return;
    station = _.pick(station, ['name', 'url', 'order', '_id']);

    var temp = _.omit(station, ['_id']);
    if (station._id && station._id.indexOf('station') != -1) {
        new RadioModel(temp).save();
    }
    else {
        RadioModel.findOneAndUpdate({
            _id: station._id
        }, temp, { upsert: true }, function (err) {
            if (err) return log.error(err);
        });
    }
}
function removeStation(station, callback = () => { }) {
    RadioModel.remove({
        _id: station._id
    }, (err) => {
        if (err) log.error(err);
        callback();
    });
}

function sendState(sendStations) {
    if (sendStations !== false) sendStations = true;
    socket.emit('Radio:state', _.omit(state, ['stations']));
    if (sendStations) RadioModel.find((err, stations) => {
        stations = _.sortBy(stations, 'order');
        _.each(stations, (station, key) => {
            if (!_.isNumber(station.order)) station.order = key;
        });
        state.stations = stations;
        socket.emit('Radio:stations', stations);
    });
}

function updateGPIO(pin, pinState, callback) {
    if (!_.isFunction(callback)) callback = () => { };

    state.playing = pinState;
    if (!gpio) return callback();
    gpio.write(pin, pinState, callback);
}

function nextStation() {
    var i = state.lastPlayed + 1;
    i %= state.stations.length;
    return state.stations[i];
}
function previousStation() {
    var i = state.lastPlayed - 1;
    if (i < 0) i = state.stations.length + i;
    return state.stations[i];
}

function startRadio(station) {
    var url;

    if (_.isObject(station) && station.url) url = station.url;

    var stationIndex = parseInt(station);
    if (stationIndex >= 0 && stationIndex < state.stations.length) url = state.stations[stationIndex].url;

    url = !url ? state.stations[state.lastPlayed].url : url;

    var index = _.findIndex(state.stations, e => e.url == url);
    if (index == -1) return log.warn('Radio was given a foreign stream url');

    station = state.stations[index];
    url = station.url;
    if (state.playing && station.order == state.lastPlayed) return;

    state.expectedToStop = state.playing;
    state.lastPlayed = station.order;
    if (player) {
        player.openFile(url);
        setTimeout(() => player.volume(state.volume));
    }
}

function stopRadio() {
    if (player) {
        player.stop();
    }
    else {
        sendState(false);
    }
}

function toggleRadio() {
    state.playing ? stopRadio() : startRadio();
}

function changeVolume(mode) {
    if (_.isString(mode)) {
        state.volume += 2 * (mode == '+' ? 1 : -1);
    }
    else if (_.isNumber(mode)) {
        state.volume = mode;
    }
    state.volume = Math.min(Math.max(state.volume, 0), 100);
    if (player) {
        player.volume(state.volume);
    }
    sendState(false);
}