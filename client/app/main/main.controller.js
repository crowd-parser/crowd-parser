'use strict';

angular.module('statisticsApp')
  .controller('MainCtrl', function ($scope, $http) {

    var socket = io();

    $scope.twitterFeed = [];
    
    $scope.getTwitterStreamSampleByNumber = function() {

      $scope.twitterFeed = [];

      var num = $scope.twitterStreamSampleNumber;
      $scope.twitterStreamSampleNumber = '';

      socket.emit('twitter stream sample', num);
      return false;
    };
    
    socket.on('twitter stream sample', function(tweet) {
      $scope.$apply(function() {
        $scope.twitterFeed.push(tweet)
      });
    });

    $scope.getTwitterStreamFilter = function() {

      $scope.twitterFeed = [];

      var num = $scope.twitterStreamFilterNumber;
      $scope.twitterStreamFilterNumber = '';

      var topics = $scope.twitterStreamFilterTopics.split(',');
      $scope.twitterStreamFilterTopics = '';
      console.log(topics);

      socket.emit('twitter stream filter', num, topics);
      return false;
    };

    socket.on('twitter stream filter', function(tweet) {
      $scope.$apply(function() {
        $scope.twitterFeed.push(tweet)
      });
    });

  });
