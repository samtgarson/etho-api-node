var app = require('express'), 
    router = app.Router(),
    ig = require('instagram-node-lib'),
    Rainbow = require('color-rainbow'),
    colour = require('color'),
    q = require('q'),
    Media = require('../models/media');

var rainbow = Rainbow.create(100).map(function(c) {
        return c.hexString();
    }),
    nearestColor = require('nearest-color').from(rainbow);

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

function getSeasons (req, res) {
    var h = {}, c = [];
    Media.find({user: req.user._id}, function(err, a) {
        a.forEach(function(m) {
            if (!h[m.season]) h[m.season] = 0;
            h[m.season] ++;
        });
        Object.keys(h).forEach(function(k) {
            c.push({season: k, count: h[k]});
        });
        res.json( c.sort(function(a, b){return b.count - a.count;}) );
    });

    function addSeason (t) {
        if (!h[t]) h[t] = 0;
        h[t] ++;
    }
}

function getColours (req, res) {
    var o = {
        map : function() {
            this.palette.forEach(function(raw, i) {
                emit( raw, i==1?2:1 );
            });
        },
        reduce : function(col, vals) {
            return Array.sum(vals);
        }
    };
    Media.mapReduce(o, function(err, c) {
        if (err) res.status(500).json(err);
        var list = {}, arr = [];
        c.forEach(function(current) {
            var col = nearestColor( current._id );
            if (!list[col]) list[col] = 0;
            list[col] += current.value;
        });
        for (var col in list) {
            arr.push({colour: col, value: list[col]});
        }

        res.json(arr);
    });

}

router.get('/', getUser);
router.get('/stream', getStream);
router.get('/tags', getTags);
router.get('/seasons', getSeasons);
router.get('/colours', getColours);

module.exports = router;