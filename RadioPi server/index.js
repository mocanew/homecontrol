const speakerPin = 11;
const async = require('async');
const gpio = require('rpi-gpio');
const spawn = require('child_process').spawn;
const fs = require('fs');
const lirc = require('lirc_node');
const Server = require('socket.io');

const dir = '/home/radiopi';

const tvRemote = true;

var pinState = {};

gpio.setup(speakerPin, gpio.DIR_OUT, () => {
    var mplayer;
    var stations = JSON.parse(fs.readFileSync(dir + '/radioStations.json'));

    var state = {
        lastPlayed: 0,
        playing: false
    };

    fs.watch(dir + '/radioStations.json', () => {
        var newFile = fs.readFileSync(dir + '/radioStations.json');

        if (!newFile) return;

        var temp;
        try {
            temp = JSON.parse(newFile);
        }
        catch (e) {
            return console.log(e);
        }
        stations = temp;
        console.log('RadioStations updated');
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
        if (state.lastPlayed < 0) state.lastPlayed = stations.length - state.lastPlayed;
        return stations[state.lastPlayed];
    }

    function startRadio (station) {
        var url = station;
        if (!station) url = stations[state.lastPlayed];
        station = parseInt(station);
        if (station >= 0 && station < stations.length) url = stations[station];

        if (!url || !url.stream) {
            url = stations[0];
            console.log ('Start radio received an empty station url');
        }
        console.log('Start radio', url.name);
        station = url;
        url = url.stream;

        async.waterfall([
            (callback) => {   
                stopRadio(true, callback);
            },
            (callback) => {
                var args = [url];

                mplayer = spawn('mplayer', args);
                //                mplayer.stdout.on('data', (data) => {
                //                    console.log(data.toString());
                //                });
                //                mplayer.stderr.on('data', (data) => {
                //                    console.log(data.toString());
                //                });
                mplayer.on('exit', (code) => {
                    state.playing = false;
                    mplayer = undefined;
                    console.log(`Child exited with code ${code}`);
                    if (code != 1) io.to('clients').emit('state', state);
                });
                callback();
            },
            (callback) => {
                updateGPIO(speakerPin, true, callback);
            }
        ], (err) => {
            if (err) console.log('Error', err);

            state.playing = true;
            state.lastPlayed = stations.indexOf(station);

            io.to('clients').emit('state', state);
        });
    }

    function stopRadio (pinState, cb) {
        if (typeof cb != 'function') cb = function () {};
        if (!mplayer || !mplayer.kill) return cb();
        if (pinState !== true) pinState = false;

        async.waterfall([
            (callback) => {
                mplayer.once('exit', () => {
                    callback();
                });
                mplayer.kill();
            },
            (callback) => {
                updateGPIO(speakerPin, pinState, callback);
            }
        ], (err) => {
            if (err) console.log('Error', err);

            state.playing = false;
            if (pinState == false) io.to('clients').emit('state', state);

            cb();
        });
    }

    function toggleRadio () {
        state.playing ? stopRadio() : startRadio();
    }

    function changeVolume (mode) {

    }

    function changeChannel (stationID) {
        if (stationID === undefined || !stations[stationID]) return;

        startRadio(stations[stationID]);
    }

    updateGPIO(speakerPin, false);
    console.log('Startup completed');
});

function cleanup () {
    gpio.destroy();
}

//process.on('exit', cleanup);
//process.on('SIGINT', cleanup);
//process.on('uncaughtException', cleanup);