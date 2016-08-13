var express = require('express');
var api = express.Router();
var config = require('../config.js');
var _ = require('lodash');

var jwt = require('jsonwebtoken');
var bCrypt = require('bcrypt-nodejs');

var mongoose = require('mongoose');
mongoose.connect(config.mongo + 'HomeControl');

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

api.post('/login', function (req, res) {
    User.findOne({
        username: req.body.username
    }, (err, user) => {
        if (err) throw err;

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found.'
            });
        }

        if (!user.isCorrectPassword(req.body.password)) {
            return res.json({
                success: false,
                message: 'Wrong password.'
            });
        }

        var token = jwt.sign(_.pick(user, ['username', '_id', 'permissionLevel']), config.secret, {
            expiresIn: '1d'
        });

        res.json({
            success: true,
            message: 'Enjoy your token!',
            token: token
        });
    });
});
api.post('/register', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;

    if (username.indexOf(' ') != -1) {
        return res.json({
            success: false,
            message: 'Invalid characters in username'
        });
    }
    if (password.length < 6) {
        return res.json({
            success: false,
            message: 'Password too short'
        });
    }
    if (!username || !password) {
        return res.json({
            success: false,
            message: 'Not enough data'
        });
    }
    User.findOne({
        'username': req.body.username
    }, (err, user) => {
        if (err) {
            console.log('Error in SignUp: ' + err);
            return res.json({
                success: false,
                message: 'Error in register'
            });
        }
        if (user) {
            console.log('User already exists');
            return res.json({
                success: false,
                message: 'User already exists'
            });
        }

        var newUser = new User({
            username: req.body.username,
            password: req.body.password,
            email: req.body.email
        });

        newUser.save(function (err) {
            if (err) {
                console.log('Error in Saving user: ' + err);
                throw err;
            }
            res.json({
                success: true,
                message: 'Hooray!'
            });
        });
    });
});

api.use(function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (!token) {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }

    jwt.verify(token, config.secret, function (err, decoded) {
        if (err) {
            return res.json({
                success: false, message:
                'Failed to authenticate token.'
            });
        }

        req.decoded = decoded;
        req.user = decoded._doc;
        next();
    });
});

api.get('/users', (req, res) => {
    if (!_.isNumber(req.user.permissionLevel) || req.user.permissionLevel < config.permissions.admin) {
        return res.status(403).send({
            success: false,
            message: 'Forbidden'
        });
    }

    User.find({}, (err, users) => res.json(users));
});

module.exports = api;