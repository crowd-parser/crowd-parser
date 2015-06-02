/**
 * Main application file
 */

'use strict';

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

require('./ioroutes')(io, T);

require('./config/express')(app);
require('./routes')(app);

// Set up database
app.database = require('./database/database.js');
app.database.trigger();

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
