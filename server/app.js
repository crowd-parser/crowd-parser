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

// var mongojs = require('mongojs');
// var db = mongojs('hillary', ['hillary']);

// // var id = 597632031796590600;
// var id = 597795992222576600;
// setInterval(function() {

//   T.get('search/tweets', {q: 'hillary clinton', count: 100, max_id: id}, function(err, data) {
//     data.statuses.forEach(function(tweet) {
//       console.log(tweet.id, tweet.created_at);

//       db.hillary.findOne({id: tweet.id}, function (err, doc) {
//         if (!doc) {
//           db.hillary.insert(tweet, function(err, doc) {
//             if (err) {
//               console.log(err);
//             }
//             console.log('inserted!')
//           });
//         }
//       });
//     })
//   });

//   id = id + 1000000000000;

// }, 10000);

// var _mysql = require('mysql');

// var mysql = _mysql.createConnection({
//   host: 'crowdparser.cloudapp.net:3307',
//   user: 'crowdparser',
//   password: 'Michael123'
// });

// mysql.connect(function(err){
//   if(err){
//     console.log("error connecting mysql ", err.stack);
//   }else{
//     console.log("connected as ID ", mysql.threadId);
//   }
// });


require('./config/express')(app);
require('./routes')(app);

// Setup database
var db = require('./database/database.js');

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
