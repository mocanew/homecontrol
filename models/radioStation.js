var config = require('../config.js');

var mongoose = require('mongoose');
mongoose.connect(config.mongo);

var RadioSchema = mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    url: {
        type: String,
        unique: true,
        required: true
    },
    order: {
        type: Number
    }
});
var Radio = mongoose.model('RadioStation', RadioSchema);

module.exports = Radio;