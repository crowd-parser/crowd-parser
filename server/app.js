/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var config = require('./config/environment');
// Setup server
var app = express();
var server = require('http').createServer(app);

var io = require('socket.io')(server);
var T = require('./config/twitter-config');
require('./ioroutes')(io, T);

require('./config/express')(app);
require('./routes')(app);

// Setup dabase
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
