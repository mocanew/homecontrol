var config = require('../config.js');
var bCrypt = require('bcrypt-nodejs');

var mongoose = require('mongoose');
mongoose.connect(config.mongo);

var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    permissionLevel: {
        type: Number,
        default: 0
    }
});
UserSchema.methods.isCorrectPassword = function (password) {
    return bCrypt.compareSync(password, this.password);
};
UserSchema.pre('save', function (next) {
    if (this.isModified('password') || this.isNew) {
        this.password = bCrypt.hashSync(this.password, bCrypt.genSaltSync(10), null);
    }
    next();
});
var User = mongoose.model('user', UserSchema);

module.exports = User;