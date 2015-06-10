/**
 * Main application file
 */

'use strict';

var fs = require('fs');

// Log any unhandled errors
// process.on('uncaughtException', function(err){
//   fs.appendFile(__dirname + '/server/server.log', new Date() + '  |  ' + err + '\n');
// });

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var config = require('./config/environment');
// Set up server
var app = express();
var server = require('http').createServer(app);

// Set up socket.io
var io = require('socket.io')(server);

try {
  var T = require('./config/twitter-config');
} catch (e) {
  console.log(e);
  var T = {};
}

// Redirect to non-www

function wwwRedirect(req, res, next) {
    if (req.headers.host.slice(0, 4) === 'www.') {
        var newHost = req.headers.host.slice(4);
        return res.redirect(301, req.protocol + '://' + newHost + req.originalUrl);
    }
    next();
};

app.set('trust proxy', true);
app.use(wwwRedirect);

require('./ioroutes')(io, T);

require('./config/express')(app);

require('./routes')(app);


// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
