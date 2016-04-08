var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var precss = require('precss');

module.exports = {
    devServer: {
        host: '0.0.0.0',
        port: 8090
    },
    entry: [
        'webpack-dev-server/client',
        'webpack/hot/only-dev-server',
        './student/js/student.jsx',
        './teacher/js/teacher.jsx'
    ],
    output: {
        path: './build',
        filename: '[name].js',
        publicPath: '/bundle'
    },
    module: {
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
            { test: /\.css$/, loaders: ['style', 'css', 'postcss'] }
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