var User = require('../models/user'),
    jwt = require('jwt-simple'),
    ig = require('instagram-node-lib');

module.exports = function(req, res, next) {
    var token = (req.headers['x-access-token']);
    if (req.method == "OPTIONS") next();
    else if (token) {
        var decoded = jwt.decode(token, process.env.APP_SECRET);
        if (decoded.exp <= Date.now()) {
            res.status(400).json({error_message: 'Access token has expired'});
        }
        User.findOne({_id: decoded.iss}, function(err, user) {
            if (!user || err) res.status(400).json({error_message: 'Invalid access token'});
            else {
                ig.set('access_token', user.token);
                req.user = user;
                next();
            }
        });

    } else {
        res.status(403).json({error_message: 'Missing access token'});
    }
};