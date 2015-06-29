var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var RelationshipSchema = new Schema({
    _f: {type: Number, ref: 'User', index: true},
    _t: {type: Number, ref: 'User'},
});

module.exports = mongoose.model('Relationship', RelationshipSchema);