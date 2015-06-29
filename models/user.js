var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserSchema = new Schema({
    token: String,
    name: String,
    bio: String, 
    profile_picture: String,
    _id: {type: Number, unique: true},
    username: String,
    website: String,
    counts: {},
    processed: Boolean,
    last_updated: Number
});

module.exports = mongoose.model('User', UserSchema);
