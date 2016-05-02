const async = require('async');
const link = require('fs-symlink');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;

var colors;

try {
    colors = require('colors');
}
catch (e) {
    // eslint doesn't allow empty functions :D
}

function log (e, color) {
    if (colors) {
        e = colors[color](e);
    }
    console.log(e);
}

async.waterfall([
    cb => {
        log('--- Webpack Build ---', 'yellow');
        var webpack = spawn(process.env.windir ? 'webpack.cmd' : 'webpack', ['--progress', '--optimize-minimize', '--optimize-dedupe', '--colors']);

        webpack.stdout.on('data', data => process.stdout.write(data));
        webpack.stderr.on('data', data => process.stdout.write(data));

        webpack.on('exit', () => cb());
    },
    cb => {
        log('--- Symlink build folder to www/build ---', 'yellow');
        link('./build/', './www/build/', 'junction').then(cb);
    },
    cb => {
        log('--- Symlink build folder to AppHomeControll/www/build ---', 'yellow');
        link('./build/', './AppHomeControll/www/build/', 'junction').then(cb);
    },
    cb => {
        log('--- NPM Shrinkwrap ---', 'yellow');
        var child = spawn(process.env.windir ? 'npm.cmd' : 'npm', ['shrinkwrap']);

        child.stdout.on('data', data => process.stdout.write(data));
        child.stderr.on('data', data => process.stdout.write(data));

        child.on('exit', () => cb());
    }
], (e) => log(e ? e : '--- Build finished ---', e ? 'red' : 'green'));