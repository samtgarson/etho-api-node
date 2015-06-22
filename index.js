var express    = require('express'),
    app        = express(),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    ig = require('instagram-node-lib'),
    mongoose = require('mongoose'),
    globalLog = require('global-request-logger');


require('dotenv').load();
// globalLog.initialize();
mongoose.connect(process.env.DB_PATH);

globalLog.on('success', function(request, response) {
  console.log('SUCCESS');
  console.log('Request', request);
  console.log('Response', response);
});
 
globalLog.on('error', function(request, response) {
  console.log('ERROR');
  console.log('Request', request);
  console.log('Response', response);
});

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