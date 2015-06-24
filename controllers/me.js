var app = require('express'), 
    router = app.Router(),
    ig = require('instagram-node-lib'),
    Media = require('../models/media'),
    methods = require('../middlewares/methods');

var router = app.Router();

function getUser (req, res) {
    res.json(req.user);
}

function getStream (req, res) {
    Media.find({user: req.user._id}).sort('-created').exec(function(err, m) {
        res.json(m);
    });
}

function getTags (req, res) {
    var h = {}, c = [], avg=0;
    Media.find({user: req.user._id}, function(err, a) {
        a.forEach(function(m) {
            m.tags.forEach(addTag);
            avg += m.tags.length;
        });
        Object.keys(h).forEach(function(k) {
            c.push({tag: k, count: h[k]});
        });
        res.json({
            tags: c.sort(function(a, b){return b.count - a.count;}),
            average: Math.round(avg / a.length),
            count: c.length
        });
    });

    function addTag (t) {
        if (!h[t]) h[t] = 0;
        h[t] ++;
    }
}

router.get('/', getUser);
router.get('/stream', getStream);
router.get('/tags', getTags);

module.exports = router;