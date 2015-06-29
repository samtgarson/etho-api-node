var app = require('express'), 
    router = app.Router(),
    request = require('request-promise'),
    jwt = require('jwt-simple'),
    ig = require('instagram-node-lib'),
    User = require('../models/user'),
    methods = require('../middlewares/methods'),
    result;

var router = app.Router();

// Get Access Token from Instagram
function processLogin (req, res) {
    if (!req.body.code) {
        res.status(400).json({
            error_message: 'Missing Auth code'
        });
    } else result = res;
    request({
        url: 'https://api.instagram.com/oauth/access_token', //URL to hit
        method: 'POST',
        form: {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: "authorization_code",
            redirect_uri: process.env.REDIRECT_URI,
            code: req.body.code,
            scope: "relationships"
        }
    }).then(getInstaUser);           
}

// Try and find our user
function getInstaUser (body){
    var r = JSON.parse(body);
    if (r.error_type) {
        result.status(r.code).json({
            error_type: r.error_type, 
            error_message: r.error_message
        });
    } else {
        ig.set('access_token', r.access_token);
        User.findOne({_id: r.user.id}, function(err, user) {
            methods.updateUser(r.user.id, r.access_token, returnToken);
            methods.updateStream(r.user.id);
        });
    }
}

// Make JWT token and return it
function returnToken (err, user) {
    if (err) result.status(500).json({error_message: 'Unable to save to database.'});
    console.log(user);
    var today = new Date(),
        expires = new Date().setDate(today.getDate() + 7),
        token = jwt.encode({
        iss: user._id,
        exp: expires
    }, process.env.APP_SECRET);

    result.json({
        token : token,
        expires: expires,
        user: user.toJSON?user.toJSON():user
    });
}

router.post('/', processLogin);

module.exports = router;