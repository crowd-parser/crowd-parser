angular.module('parserApp.twitterService', [])

.factory('Twitter', function () {
  
  var socket = io();
  var tweetsArray = [];
  var countToGet;

  return {
    socket: socket,
    tweetsArray: tweetsArray,
    countToGet: countToGet
  };
});