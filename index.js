// MONGOLAB_URI=mongodb://heroku_lbblvk60:utb7schol72urg6cqaimc4dm9r@ds047468.mongolab.com:47468/heroku_lbblvk60
var express    = require('express'),
    app        = express(),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    ig = require('instagram-node-lib'),
    mongoose = require('mongoose');


require('dotenv').load();
// globalLog.initialize();
mongoose.connect(process.env.MONGOLAB_URI);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('dev'));

var port = process.env.PORT || 8081;

app.use('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
    next();
});


app.use(require('./controllers'));

app.listen(port);