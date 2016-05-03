var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var precss = require('precss');

module.exports = {
    devServer: {
        host: '0.0.0.0',
        port: 8090,
        historyApiFallback: {
            index: '/'
        }
    },
    entry: [
        'webpack-dev-server/client',
        'webpack/hot/only-dev-server',
        './www/index.jsx'
    ],
    output: {
        path: './build',
        filename: 'bundle.js',
        publicPath: '/assets/'
    },
    amd: {
        jQuery: true
    },
    module: {
        preLoaders: [
            { test: /\.js?$/, exclude: /node_modules/, loader: 'eslint-loader' },
            { test: /\.jsx?$/, exclude: /node_modules/, loader: 'eslint-loader' }
        ],
        loaders: [
            { test: /\.jsx?$/, exclude: /node_modules/, loader: 'react-hot' },
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015', 'react']
                }
            },
            { test: /\.png$/, loader: 'url-loader?limit=10000&minetype=image/png' },
            { test: /\.jpg$/, loader: 'url-loader?limit=10000&minetype=image/jpg' },
            { test: /\.gif$/, loader: 'url-loader?limit=10000&minetype=image/gif' },
            {
                test: /\.scss$/,
                loaders: ['style', 'css', 'postcss', 'sass']
            },
            { test: /\.css$/, loaders: ['style', 'css', 'postcss'] },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file' },
            { test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/, loader:'url?limit=5000' },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=application/octet-stream' },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=image/svg+xml' }
        ]
    },
    postcss: function () {
        return [autoprefixer, precss];
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ],
    externals: {},
    resolve: {
        extensions: ['', '.js', '.jsx']
    }
};