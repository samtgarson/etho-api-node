var app = require('express'), 
    router = app.Router(),
    ig = require('instagram-node-lib'),
    Media = require('../models/media');

var router = app.Router();

function getUser (req, res) {
    res.json(req.user);
}

function getStream (req, res) {
    var id = req.user._id;
    Media.find({user: id}, function(err, m) {
        res.json(m);
    });
}

router.get('/', getUser);
router.get('/stream', getStream);

module.exports = router;