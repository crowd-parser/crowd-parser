'use strict';

angular.module('statisticsApp')
  .controller('MainCtrl', function ($scope, $http) {

  var socket = io();

  $scope.twitterFeed = [];
  
  $scope.getTwitterStreamSampleByNumber = function() {

    $scope.twitterFeed = [];
    $scope.numberReceived = 0;

    var num = $scope.twitterStreamSampleNumber;
    $scope.twitterStreamSampleNumber = '';

    socket.emit('twitter stream sample', num);
    return false;
  };
  
  socket.on('twitter stream sample', function(tweet) {

    $scope.$apply(function() {
      $scope.twitterFeed.push(tweet);
      $scope.numberReceived++;
    });
  });

  var topics;
  $scope.numberReceived = 0;
  $scope.topicsReceived = 0;
  $scope.numberLeftOver = 0;
  $scope.topicsNumberReceived = [];

  $scope.getTwitterStreamFilter = function() {

    $scope.twitterFeed = [];
    $scope.numberReceived = 0;
    $scope.topicsReceived = 0;
    $scope.topicsNumberReceived = [];

    var num = $scope.twitterStreamFilterNumber;
    $scope.twitterStreamFilterNumber = '';

    

    topics = $scope.twitterStreamFilterTopics.split(',');

    topics.forEach(function(topic, i) {
      $scope.topicsNumberReceived[i] = {};
      $scope.topicsNumberReceived[i].count = 0;
      $scope.topicsNumberReceived[i].topic = topic.trim();
    });

    $scope.twitterStreamFilterTopics = '';

    socket.emit('twitter stream filter', num, topics);
    return false;
  };

  socket.on('twitter stream filter', function(tweet) {

    $scope.$apply(function() {
      $scope.twitterFeed.push(tweet);
      $scope.numberReceived++;
      topics.forEach(function(topic, i) {

        if (tweet.text.toLowerCase().indexOf(topic.toLowerCase()) !== -1) {
          $scope.topicsNumberReceived[i].count++;
          $scope.topicsReceived++;
        }
      });
      $scope.numberLeftOver = $scope.numberReceived - $scope.topicsReceived;
    });
  });

});

// created_at
// id
// id_str
// text
// source
// truncated
// in_reply_to_status_id
// in_reply_to_status_id_str
// in_reply_to_user_id
// in_reply_to_user_id_str
// in_reply_to_screen_name
// user
// geo
// coordinates
// place
// contributors
// retweeted_status
// retweet_count
// favorite_count
// entities
// extended_entities
// favorited
// retweeted
// possibly_sensitive
// filter_level
// lang
// timestamp_ms
