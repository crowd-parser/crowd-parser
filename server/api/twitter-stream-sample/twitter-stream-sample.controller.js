/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');

var Twit = require('twit');

var express = require('express');
// Setup server
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var T = new Twit({
  consumer_key: 'LzrzGCydhWiwdBBleA5TfxLOO', 
  consumer_secret: 'Qb3Io9LVPAyW0FOzdQUwqQ2ymNv7cSGrEa3fw5OcH9qKdCOrOB', 
  access_token: '19341319-ZafhlXVvwKtwddQh8vmU6b6XylgxTKsd0cwOBwJuD', 
  access_token_secret: 'FG1DWyme86ZfGRJTlF3x6oBsu7FBQCmKLCqMuSDs7ZUQB'
});

io.on('connection', function(socket) {
  var count = 0;
  socket.on('twitter stream', function(num) {

    var stream = T.stream('statuses/filter', {track: '#apple', language: 'en'});
    console.log('hello');
    stream.on('tweet', function(tweet) {
      io.emit('twitter stream', tweet);
      count++;
      if (count === 20) {
        stream.stop();
      }
    });
  });
});


// Get list of things
exports.index = function(req, res) {
  
  var stream = T.stream('statuses/sample');
  var tweets = [];
  console.log(req.params.id);

  stream.on('tweet', function(tweet) {
    tweets.push(tweet);

    if (tweets.length === 20) {
      stream.stop();
      res.json(tweets);
    }
  });
};