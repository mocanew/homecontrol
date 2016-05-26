const async = require('async');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const rimraf = require('rimraf');

var colors;

try {
    colors = require('colors');
}
catch (e) {
    // eslint doesn't allow empty functions :D
}

function log(e, color) {
    if (colors) {
        e = colors[color](e);
    }
    console.log(e);
}

async.waterfall([
    cb => rimraf('./assets/', {}, cb),
    cb => {
        if (process.argv.indexOf('--webpack') == -1) return cb();

        log('--- Webpack Build ---', 'yellow');
        var webpack = spawn(process.env.windir ? 'webpack.cmd' : 'webpack', ['--production', '--progress', '--optimize-minimize', '--optimize-dedupe', '--colors']);
        // var webpack = spawn(process.env.windir ? 'webpack.cmd' : 'webpack', ['--progress', '--colors']); // debug

        webpack.stdout.on('data', data => process.stdout.write(data));
        webpack.stderr.on('data', data => process.stdout.write(data));

        webpack.on('exit', () => cb());
    },
    cb => {
        if (process.argv.indexOf('--android') == -1) return cb();

        log('--- Copy assets folder to AppHomeControll/www/assets ---', 'yellow');
        var copy = require('copy');
        copy('./assets/*.*', './AppHomeControll/www/assets/', () => cb());
    },
    cb => {
        if (process.argv.indexOf('--android') == -1) return cb();

        log('--- Build Android app ---', 'yellow');
        var cordova = spawn(process.env.windir ? 'cordova.cmd' : 'cordova', ['build', '--release', 'android'], {
            cwd: './AppHomeControll'
        });

        cordova.stdout.on('data', data => process.stdout.write(data));
        cordova.stderr.on('data', data => process.stdout.write(data));

        cordova.on('exit', () => cb());
    },
    cb => {
        if (process.argv.indexOf('--android') == -1) return cb();

        log('--- Sign APK ---', 'yellow');
        exec('jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore Radiopi.keystore -storepass rontavstudio ./AppHomeControll/platforms/android/build/outputs/apk/android-release-unsigned.apk Radiopi', () => cb());
    },
    cb => {
        if (process.argv.indexOf('--android') == -1) return cb();

        log('--- Align APK ---', 'yellow');
        exec('zipalign -f -v 4 ./AppHomeControll/platforms/android/build/outputs/apk/android-release-unsigned.apk ./radiopi.apk', () => cb());
    },
    cb => {
        if (process.argv.indexOf('--install') == -1) return cb();

        log('--- Install apk ---', 'yellow');
        var called = false;
        var timeout = setTimeout(() => {
            adb.kill();
            if (!called) cb('No devices found');
            called = true;
        }, 10000);
        var adb = spawn('adb', ['install', '-r', 'radiopi.apk']);

        adb.stdout.on('data', data => {
            clearTimeout(timeout);
            process.stdout.write(data);
        });
        adb.stderr.on('data', data => process.stdout.write(data));

        adb.on('exit', () => {
            if (!called) cb();
            called = true;
        });
    },
    cb => {
        if (process.argv.indexOf('--install') == -1) return cb();

        exec('adb shell am start -a android.intent.action.MAIN -n com.rontavstudio.radiopi/.MainActivity', () => cb());
    }
], (e) => log(e ? e : '--- Build finished ---', e ? 'red' : 'green'));