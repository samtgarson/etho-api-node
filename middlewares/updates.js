var Media = require('../models/media'),
    ig = require('instagram-node-lib'),
    request = require('request-promise'),
    colorThief = require('color-thief'),
    User = require('../models/user'),
    Relationship = require('../models/relationship'),
    q = require('q'),
    season = require('date-season')({autumn: true}),
    moment = require('moment'),
    colour = require('color'),
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
                    _id: parseInt(d.id),
                    username: d.username,
                    website: d.website,
                    counts: d.counts,
                    processed: true,
                    last_updated: moment().valueOf()
                };
                getEdges({id: u._id}, 'follows', 0, 2);
                User.findOneAndUpdate({_id: id}, u, {upsert: true}, function(err, old_user) {
                    cb(err, u);
                });
            }
        });



        function processUsers (user, target, layer, limit, action) {
            new Relationship(qBuild(action, user, target)).save();
            if (layer < limit) {
                User.findOne({_id: target}, function (err, u) {
                    if ( err || !u || moment(u.last_updated).add(5, 'd').isBefore(moment(), 'day') ) {
                        getEdges({id:target, new: true}, action, layer, limit);
                    }
                });
            }
        }

        function qBuild (action, user, target) {
            if (action == 'follows') return  {_f: user, _t: target};
            else return {_f: target, _t: user};
        }

        function getEdges(user, action, layer, limit, cursor) {
            if (user.new) {
                User.findOneAndUpdate({_id: user.id}, {_id: user.id, last_updated: moment().valueOf()}, {upsert: true}).exec();
            }
            if (!cursor) Relationship.remove({_f: user.id}).exec();
            ig.users[action]({
                user_id: user.id, 
                cursor: cursor,
                complete: function(a, pagination) {
                    if (a.length) {
                        a.forEach(function (f) {
                            processUsers(user.id, f.id, layer+1, limit, action);
                        });
                        if (pagination.next_cursor && pagination.next_cursor != cursor) getEdges({id: user.id}, action, layer, limit, pagination.next_cursor);
                    }
                },
                error: function(err) {
                    console.log(err);
                }
            });
        }
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
            var media = {
                user: id,
                isVideo: m.type != "image",
                tags: m.tags,
                location: m.location?[m.location.latitude, m.location.longitude]:false,
                comments: m.comment,
                created: new Date(parseInt(m.created_time) * 1000),
                likes: m.likes,
                link: m.link,
                url: m.images.standard_resolution.url,
                taggedUsers: m.users_in_photo,
                caption: m.caption.text,
                _id: parseInt(m.id)
            };

            request({url: media.url, encoding: null}, function(err, r, buffer) {
                media.palette = thief.getPalette(buffer, 4, 5).map(converter);
                media.season = season(media.created);
                media.processed = true;

                Media.findOneAndUpdate({_id: media._id}, media, {upsert: true}).exec();

                function converter (n) {
                    return colour().rgb(n).hexString();
                }
            });
        }

    }
};