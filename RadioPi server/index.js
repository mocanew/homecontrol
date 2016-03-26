const speakerPin = 11;
const async = require('async');
const gpio = require('rpi-gpio');
const fs = require('fs');
const lirc = require('lirc_node');
const Server = require('socket.io');
const Minilog = require('minilog');
Minilog.pipe(Minilog.backends.console.formatColor).pipe(Minilog.backends.console);
const log = Minilog('RadioPi \t');
const MPlayer = require('mplayer');
const player = new MPlayer();

const dir = '/home/radiopi';

const tvRemote = true;

var pinState = {};

gpio.setup(speakerPin, gpio.DIR_OUT, () => {
    var stations = JSON.parse(fs.readFileSync(dir + '/radioStations.json'));

    var state = {
        lastPlayed: 0,
        playing: false,
        volume: 100
    };
    var restart = false;

    player.on('stop', () => {
        state.playing = false;
        log.info(Date.now(), 'Mplayer stopped', restart);
        if (!restart) {
            updateGPIO (speakerPin, false);
            io.to('clients').emit('state', state);
        }
    });

    fs.watch(dir + '/radioStations.json', () => {
        var newFile = fs.readFileSync(dir + '/radioStations.json');

        if (!newFile) return;

        var temp;
        try {
            temp = JSON.parse(newFile);
        }
        catch (e) {
            return log.error(Date.now(), e);
        }
        stations = temp;
        log.info(Date.now(), 'RadioStations updated');
        showStationsNames();
    });

    if (tvRemote) {
        lirc.init();
        lirc.addListener((data) => {
            if (!data || !data.key || !data.repeat) return;

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
        }, 200);
    }

    var io = new Server();
    io.listen(7274);

    io.on('connection', (socket) => {
        socket.join('clients');
        socket.emit('radioStations', stations);

        socket.emit('playState', state);

        socket.on('startRadio', startRadio);
        socket.on('stopRadio', () => { 
            stopRadio(); 
        });
        socket.on('toggleRadio', toggleRadio);
        socket.on('requestStations', () => {
            socket.emit('radioStations', stations);
        });
    });

    function updateGPIO (pin, state, callback) {
        if (typeof callback != 'function') callback = function () {};

        if (pinState[pin] === state) return callback();
        pinState[pin] = state;

        gpio.write(pin, state, callback);
    }

    function nextStation () {
        state.lastPlayed++;
        state.lastPlayed %= stations.length;
        return stations[state.lastPlayed];
    }
    function previousStation () {
        state.lastPlayed--;
        if (state.lastPlayed < 0) state.lastPlayed = stations.length + state.lastPlayed;
        return stations[state.lastPlayed];
    }

    function startRadio (station) {
        var url = station;
        if (!station) url = stations[state.lastPlayed];
        station = parseInt(station);
        if (station >= 0 && station < stations.length) url = stations[station];

        if (!url || !url.stream) {
            url = stations[0];
            log.warning (Date.now(), 'Start radio received an empty station url');
        }
        log.info(Date.now(), 'Start radio', url.name);
        station = url;
        url = url.stream;

        restart = true;
        player.openFile(url);
        player.play();
        updateGPIO(speakerPin, true);

        state.playing = true;
        state.lastPlayed = stations.indexOf(station);

        io.to('clients').emit('state', state);
    }

    function stopRadio () {
        restart = false;
        player.stop();
    }

    function toggleRadio () {
        restart ? stopRadio() : startRadio();
    }

    function changeVolume (mode) {
        if (typeof mode == 'string') {
            state.volume += 5 * (mode == '+' ? 1 : -1);
        }
        else if (typeof mode == 'number') {
            state.volume = mode;
        }
        state.volume = Math.min(Math.max(state.volume, 0), 100);
        log.debug('New volume', state.volume);
        player.volume(state.volume);
    }

    function changeChannel (stationID) {
        if (stationID === undefined || !stations[stationID]) return;

        startRadio(stations[stationID]);
    }

    updateGPIO(speakerPin, false);
    log.info(Date.now(), 'Startup completed');
});

function cleanup () {
    gpio.destroy();
}

//process.on('exit', cleanup);
//process.on('SIGINT', cleanup);
//process.on('uncaughtException', cleanup);