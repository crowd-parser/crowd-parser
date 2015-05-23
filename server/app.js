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
var T = require('./config/twitter-config');
require('./ioroutes')(io, T);

require('./config/express')(app);
require('./routes')(app);

// Set up database
app.database = require('./database/database.js');
app.database.trigger(function(){console.log("TRIGGERED")});

// var ENABLE_LIVE_STREAM_WRITE_TO_DATABASE = true;

// if(ENABLE_LIVE_STREAM_WRITE_TO_DATABASE){
//   var stream = T.stream('statuses/sample');
//   var count = 0;
//   stream.on('tweet', function(tweet) {
//     if (tweet.lang === 'en') {
//       count++;
//       if (count === 1 || count % 3 === 0) {
//         if(!app.database || !app.database.isLive){
//           console.log("WAITING FOR DB");
//           return;
//       }
//         app.database.addTweet(tweet, function(err, rows, fields) {
//           if (err) {
//             console.log(err);
//           } else {
//             io.emit('tweet added', tweet.id);
//             console.log('tweet added!', tweet.id);
//           }
//         })
//       }
//     }
//   });

//   io.on('stop download', function() {
//     console.log('STOP *******************')
//     stream.stop();
//   })
// }

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
