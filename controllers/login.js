var app = require('express'), 
    router = app.Router(),
    request = require('request'),
    jwt = require('jwt-simple'),
    ig = require('instagram-node-lib'),
    User = require('../models/user'),
    Media = require('../models/media'),
    colorThief = require('color-thief'),
    thief = new colorThief(),
    result;

var router = app.Router();

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
    }, getInstaUser);           
}

function getInstaUser (error, response, body){
    var r = JSON.parse(body);
    if (r.error_type) {
        result.status(r.code).json({
            error_type: r.error_type, 
            error_message: r.error_message
        });
    } else {
        ig.set('access_token', r.access_token);
        User.findOne({_id: r.user.id}, function(err, user) {
            if (!user) {
                getInstaInfo(r);
                getMedia(r.user.id);
            } else {
                returnToken(false, user);
            }
        });
    }
}

function getInstaInfo(r) {
    ig.users.info({
        user_id: 'self', 
        complete: function (d) {
            var u = new User({
                token: r.access_token,
                name: d.full_name,
                bio: d.bio, 
                profile_picture: d.profile_picture,
                _id: d.id,
                username: d.username,
                website: d.website,
                counts: d.counts
            });
            u.save(returnToken);
            // returnToken(null, u);
        }
    });
}

function returnToken (err, user) {
    if (err) result.status(500).json({error_message: 'Unable to save to database.'});
    var today = new Date(),
        expires = new Date().setDate(today.getDate() + 7),
        token = jwt.encode({
        iss: user._id,
        exp: expires
    }, process.env.APP_SECRET);

    result.json({
        token : token,
        expires: expires,
        user: user.toJSON()
    });
}

function getMedia (id, next_max_id) {
    ig.users.recent({
        user_id: 'self', 
        max_id: next_max_id,
        complete: function(media, pagination) {
            if (media.length) {
                media.forEach(function(m) {processMedia(m, id);});
                if (pagination.next_max_id) getMedia(id, pagination.next_max_id);
            }
        }
    });
}

function processMedia (m, id) {
    var media = new Media ({
        user: id,
        isVideo: m.type != "image",
        tags: m.tags,
        location: [m.location.latitude, m.location.longitude],
        comments: m.comment,
        created: new Date(parseInt(m.created_time) * 1000),
        likes: m.likes,
        link: m.link,
        url: m.images.standard_resolution.url,
        taggedUsers: m.users_in_photo,
        caption: m.caption.text,
        _id: m.id
    });
    request({url: media.url, encoding: null}, function(err, response, buffer) {
        if (err) console.error(err);
        else {
            media.palette = thief.getPalette(buffer, 4, 5);
            media.save();
        }
    });
    
}



router.post('/', processLogin);

module.exports = router;