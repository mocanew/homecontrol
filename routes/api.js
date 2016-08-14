var express = require('express');
var api = express.Router();
var config = require('../config.js');
var _ = require('lodash');

var User = require('../models/user.js');

var passport = require('passport');

api.post('/login', (req, res) => {
    passport.authenticate('local', function (err, user, info) {
        if (err) console.log(err);
        if (!user) return res.status(401).json(info);

        req.logIn(user, (err) => {
            if (err) console.log(err);

            res.json({
                success: true,
                message: 'Hooray!'
            });
        });
    })(req, res);
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
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
        if (user) {
            console.log('User already exists');
            return res.status(400).json({
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

api.use((req, res, next) => {
    if (!req.isAuthenticated()) {
        res.status(403).json({
            success: 'false',
            message: 'Forbidden'
        });
        return;
    }
    next();
});

api.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
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