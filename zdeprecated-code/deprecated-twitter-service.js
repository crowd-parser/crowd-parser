angular.module('parserApp.twitterService', [])

.factory('Twitter', function () {

  // ========== Setup =============== //
  
  var socket = io();
  var countToGet;

  // ======== twitter-stream-sample section ======== //

  var getTwitterStreamSample = function(count) {
    socket.emit('twitter stream sample', count);
  };

  // =========== twitter-stream-filter section =========== //

  var getTwitterStreamFilter = function(count, topics) {
    socket.emit('twitter stream filter', count, topics);
  };

  // ============ receive twitter-stream ============ //

  var receiveTwitterStream = function(type, callback) {
    socket.on('twitter stream ' + type, function(tweet) {
      callback(tweet);
    });
  };

  return {
    // Setup
    socket: socket,
    countToGet: countToGet,

    // twitter-stream-sample
    getTwitterStreamSample: getTwitterStreamSample,
    receiveTwitterStream: receiveTwitterStream,

    // twitter-stream-filter
    getTwitterStreamFilter: getTwitterStreamFilter
  };
});