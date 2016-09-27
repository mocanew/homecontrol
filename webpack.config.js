var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var precss = require('precss');
var path = require('path');

var exp = {
    devServer: {
        host: '0.0.0.0',
        port: 8090,
        historyApiFallback: {
            index: '/'
        }
    },
    entry: {
        bundle: './www/index.jsx'
    },
    output: {
        path: path.join(__dirname, 'assets'),
        filename: '[name].js',
        publicPath: '/assets/'
    },
    module: {
        preLoaders: [
            { test: /\.jsx?$/, exclude: /node_modules/, loader: 'eslint-loader' }
        ],
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015', 'react']
                }
            },
            { test: /\.json$/, loader: 'json-loader' },
            { test: /\.png$/, loader: 'url-loader?limit=10000&minetype=image/png' },
            { test: /\.jpg$/, loader: 'url-loader?limit=10000&minetype=image/jpg' },
            { test: /\.gif$/, loader: 'url-loader?limit=10000&minetype=image/gif' },
            {
                test: /\.scss$/,
                loaders: ['style', 'css', 'postcss', 'sass']
            },
            { test: /\.css$/, loaders: ['style', 'css', 'postcss'] },
            {
                test: /\.(eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
                loader: 'url-loader'
            }
        ]
    },
    postcss: function () {
        return [autoprefixer, precss];
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                browser: true
            }
        })
    ],
    externals: {},
    resolve: {
        extensions: ['', '.js', '.jsx']
    }
};

if (process.argv && process.argv.indexOf('--production') != -1) {
    exp.plugins.push(
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        })
    );
}
else {
    exp.entry.webpack = 'webpack-dev-server/client?http://0.0.0.0:8090';
    exp.entry.webpackHot = 'webpack/hot/only-dev-server';
}

module.exports = exp;