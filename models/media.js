var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MediaSchema = new Schema({
    user: {type: String, ref: 'User'},
    isVideo: Boolean,
    tags: [],
    location: [String],
    comments: {},
    created: Date,
    likes: {},
    link: String,
    url: String,
    taggedUsers: [],
    caption: String,
    _id: {type: String, unique: true},
    palette: [{}],
    processed: {type: Boolean, default: false}
});

module.exports = mongoose.model('Media', MediaSchema);
