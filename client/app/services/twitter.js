'use strict';

angular.module('parserApp.twitterService', [])

.factory('Twitter', function ($http, $window) {

  // ========== Setup =============== //

  var socket = $window.io();

  var getTweetsForKeyword = function(keyword, cb) {
    $http.get('/database/getTweetsForKeyword')
      .success(function(data) {
        cb(data);
      });
  };

  var getTwitterRestSearch = function(query) {
    socket.emit('twitter rest search', query, 'mixed', 100);
  };

  var getTweetsCount = function(callback) {
    $http.get('/statistics/getTweetsCount')
      .success(function(data) {

      var result = addCommas(data[0].id);

      callback(result);
    });
  };

  var addCommas = function(num) {
    num = num.toString().split('');
    var numberOfCommas = Math.floor(num.length / 3);
    var index = -3;

    while (numberOfCommas) {
      num.splice(index, 0, ',');
      numberOfCommas--;
      index -= 4;
    }

    return num.join('');
  };

  return {
    socket: socket,

    getTweetsForKeyword: getTweetsForKeyword,

    getTwitterRestSearch: getTwitterRestSearch,

    getTweetsCount: getTweetsCount

  };
});