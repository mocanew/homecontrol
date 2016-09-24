const async = require('async');
const _ = require('lodash');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const rimraf = require('rimraf');

var colors;
var zip = {
    files: [
        'homeControl.js',
        'package.json',
        'LICENSE',
        'www/index.html'
    ],
    dirs: [
        'models',
        'routes',
        'servers',
        'assets',
        'www/images'
    ]
};

try {
    colors = require('colors');
}
catch (e) {
    console.warn('Colors is not installed. I\'m ugly :\'(');
}

function log(e, color) {
    if (colors) {
        e = colors[color](e);
    }
    console.log(e);
}
function isMode(mode) {
    return process.argv.indexOf(mode) != -1 || process.argv.indexOf('--' + mode) != -1;
}

async.waterfall([
    cb => {
        if (!isMode('webpack')) return cb();

        rimraf('./assets/', {}, cb);
    },
    cb => {
        if (!isMode('zip')) return cb();

        rimraf('./build.zip', {}, cb);
    },
    cb => {
        if (!isMode('webpack')) return cb();

        log('--- Webpack Build ---', 'yellow');
        var webpack = spawn(process.env.windir ? 'webpack.cmd' : 'webpack', ['--production', '--progress', '--optimize-minimize', '--optimize-dedupe', '--colors']);
        // var webpack = spawn(process.env.windir ? 'webpack.cmd' : 'webpack', ['--progress', '--colors']); // debug

        webpack.stdout.on('data', data => process.stdout.write(data));
        webpack.stderr.on('data', data => process.stdout.write(data));

        webpack.on('exit', () => cb());
    },
    cb => {
        if (!isMode('android')) return cb();

        log('--- Copy assets folder to AppHomeControll/www/assets ---', 'yellow');
        var copy = require('copy');
        copy('./assets/*.*', './AppHomeControll/www/assets/', () => cb());
    },
    cb => {
        if (!isMode('android')) return cb();

        log('--- Build Android app ---', 'yellow');
        var cordova = spawn(process.env.windir ? 'cordova.cmd' : 'cordova', ['build', '--release', 'android'], {
            cwd: './AppHomeControll'
        });

        cordova.stdout.on('data', data => process.stdout.write(data));
        cordova.stderr.on('data', data => process.stdout.write(data));

        cordova.on('exit', () => cb());
    },
    cb => {
        if (!isMode('android')) return cb();

        log('--- Sign APK ---', 'yellow');
        exec('jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore Radiopi.keystore -storepass rontavstudio ./AppHomeControll/platforms/android/build/outputs/apk/android-release-unsigned.apk Radiopi', () => cb());
    },
    cb => {
        if (!isMode('android')) return cb();

        log('--- Align APK ---', 'yellow');
        exec('zipalign -f -v 4 ./AppHomeControll/platforms/android/build/outputs/apk/android-release-unsigned.apk ./radiopi.apk', () => cb());
    },
    cb => {
        if (!isMode('install')) return cb();

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
        if (!isMode('install')) return cb();

        exec('adb shell am start -a android.intent.action.MAIN -n com.rontavstudio.radiopi/.MainActivity', () => cb());
    },
    cb => {
        if (!isMode('zip')) return cb();

        log('--- Archive build ---', 'yellow');
        var AdmZip = require('adm-zip');

        var zipFile = new AdmZip();

        _.each(zip.files, (file) => {
            zipFile.addLocalFile(file, file.lastIndexOf('/') != -1 ? file.substr(0, file.lastIndexOf('/')) : '');
        });
        _.each(zip.dirs, (dir) => {
            zipFile.addLocalFolder(dir, dir);
        });
        zipFile.writeZip('./build.zip');
        cb();
    }
], (e) => log(e ? e : '--- Build finished ---', e ? 'red' : 'green'));