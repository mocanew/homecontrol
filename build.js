const async = require('async');
const spawn = require('child_process').spawn;
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
        log('--- Webpack Build ---', 'yellow');
        var webpack = spawn(process.env.windir ? 'webpack.cmd' : 'webpack', ['--production', '--progress', '--optimize-minimize', '--optimize-dedupe', '--colors']);
        // var webpack = spawn(process.env.windir ? 'webpack.cmd' : 'webpack', ['--progress', '--colors']); // debug

        webpack.stdout.on('data', data => process.stdout.write(data));
        webpack.stderr.on('data', data => process.stdout.write(data));

        webpack.on('exit', () => cb());
    },
    cb => {
        log('--- Copy assets folder to AppHomeControll/www/assets ---', 'yellow');
        var copy = require('copy');
        copy('./assets/*.*', './AppHomeControll/www/assets/', cb);
    }
    // cb => {
    //     log('--- NPM Shrinkwrap ---', 'yellow');
    //     var child = spawn(process.env.windir ? 'npm.cmd' : 'npm', ['shrinkwrap']);

    //     child.stdout.on('data', data => process.stdout.write(data));
    //     child.stderr.on('data', data => process.stdout.write(data));

    //     child.on('exit', () => cb());
    // }
], (e) => log(e ? e : '--- Build finished ---', e ? 'red' : 'green'));