const dir = process.env.windir ? './RadioPi' : '/home/node/homecontrol/RadioPi';
const tvRemote = true;
const speakerPin = 11;
const fs = require('fs');
const lirc = require('lirc_node');
const io = require('socket.io-client');
const Minilog = require('minilog');
Minilog.pipe(Minilog.backends.console.formatMinilog).pipe(Minilog.backends.console);
const log = Minilog('RadioPi \t');
const MPlayer = require('mplayer');

var gpio, player;
try {
    gpio = require('rpi-gpio');
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

var stations = JSON.parse(fs.readFileSync(dir + '/radioStations.json'));

var state = {
    lastPlayed: 0,
    playing: false,
    volume: 100,
    expectedToStop: false,
    stopping: false
};

var socket = io.connect('http://localhost:8080', {
    reconnect: true,
    reconnectionDelayMax: 1000
});
socket.on('connect', () => {
    log.debug('Connected to homeControl');
    socket.emit('setServerName', 'Radio');
});

if (gpio) {
    gpio.setup(speakerPin, gpio.DIR_OUT, startup);
}
else {
    startup();
}
function startup() {
    if (player) {
        player.on('stop', () => {
            if (state.expectedToStop) {
                state.expectedToStop = false;
                return;
            }

            updateGPIO(speakerPin, false);
            socket.emit('Radio:state', state);
            log.info('Mplayer stopped');
            log.debug(state);
        });
        player.on('start', () => {
            updateGPIO(speakerPin, true);

            socket.emit('Radio:state', state);
            log.info('Start radio', stations[state.lastPlayed].name);
        });
        player.on('status', () => {
            log.debug(player.status);
        });
    }

    fs.watch(dir + '/radioStations.json', () => {
        var newFile = fs.readFileSync(dir + '/radioStations.json');

        if (!newFile) return;

        var temp;
        try {
            temp = JSON.parse(newFile);
        }
        catch (e) {
            return log.error(e);
        }
        stations = temp;
        log.info('RadioStations updated');
    });

    if (gpio && tvRemote) {
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
    socket.on('Radio:state', () => {
        socket.emit('Radio:state', state);
        socket.emit('Radio:stations', stations);
    });

    updateGPIO(speakerPin, false);
    socket.emit('Radio:state', state);
    socket.emit('Radio:stations', stations);
    log.info('Startup completed');
}

function updateGPIO(pin, pinState, callback) {
    if (typeof callback != 'function') callback = function () { };

    state.playing = pinState;
    if (!gpio) return callback();
    gpio.write(pin, pinState, callback);
}

function nextStation() {
    var i = state.lastPlayed + 1;
    i %= stations.length;
    return stations[i];
}
function previousStation() {
    var i = state.lastPlayed - 1;
    if (i < 0) i = stations.length + i;
    return stations[i];
}

function startRadio(station) {
    var url = station;
    if (!station) url = stations[state.lastPlayed];
    station = parseInt(station);
    if (station >= 0 && station < stations.length) url = stations[station];

    if (!url || !url.stream) {
        url = stations[0];
        log.warn('Start radio received an empty station url');
    }
    var index = -1;
    stations.forEach((e, i) => {
        if (e.stream == url.stream) index = i;
    });
    if (index == -1) return log.warn('Radio was given a foreign stream url');
    station = stations[index];
    url = station.stream;

    if (state.playing && index == state.lastPlayed) return;

    state.expectedToStop = state.playing;
    state.lastPlayed = index;

    if (player) {
        log.debug(url, state);
        player.openFile(url);
    }
}

function stopRadio() {
    if (player) {
        player.stop();
    }
    else {
        socket.emit('Radio:state', state);
    }
}

function toggleRadio() {
    state.playing ? stopRadio() : startRadio();
}

function changeVolume(mode) {
    if (typeof mode == 'string') {
        state.volume += 5 * (mode == '+' ? 1 : -1);
    }
    else if (typeof mode == 'number') {
        state.volume = mode;
    }
    state.volume = Math.min(Math.max(state.volume, 0), 100);
    log.debug('New volume', state.volume);
    if (player) {
        player.volume(state.volume);
    }
    socket.emit('Radio:state', state);
}