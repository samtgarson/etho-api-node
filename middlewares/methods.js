var Media = require('../models/media'),
    ig = require('instagram-node-lib'),
    request = require('request-promise'),
    colorThief = require('color-thief'),
    User = require('../models/user'),
    q = require('q'),
    thief = new colorThief();

module.exports = {
    updateUser: function (id, token, cb) {
        if (!cb) cb = function() {};
        ig.users.info({
            user_id: 'self', 
            complete: function (d) {
                var u = {
                    token: token,
                    name: d.full_name,
                    bio: d.bio, 
                    profile_picture: d.profile_picture,
                    _id: d.id,
                    username: d.username,
                    website: d.website,
                    counts: d.counts
                };
                User.findOneAndUpdate({_id: id}, u, {upsert: true}, cb);
            }
        });
    },
    // Get users media
    updateStream: function getMedia (id, prev_min_id, next_max_id) {
        ig.users.recent({
            user_id: 'self', 
            min_id: prev_min_id,
            max_id: next_max_id,
            complete: function(media, pagination) {
                if (media.length) {
                    media.forEach(function(m) {processMedia(m, id);});
                    if (pagination.next_max_id) getMedia(id, null, pagination.next_max_id);
                }
            }
        });

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
            var colours = q(request({url: media.url, encoding: null}));

            colours.then(function(buffer) {
                media.palette = thief.getPalette(buffer, 4, 5);
            });

            q.all([colours]).then(function() {
                media.processed = true;
                media.save();
            });
        }
    }
};