var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserSchema = new Schema({
    token: String,
    name: String,
    bio: String, 
    profile_picture: String,
    _id: {type: String, unique: true},
    username: String,
    website: String,
    counts: {}
});

module.exports = mongoose.model('User', UserSchema);
