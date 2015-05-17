'use strict';

angular.module('parserApp')
  .controller('MainCtrl', function ($scope, Wordcloud) {

    

  var socket = io();

  $scope.twitterFeed = [];
  var num;
  
  $scope.getTwitterStreamSampleByNumber = function() {

    $scope.twitterFeed = [];
    $scope.numberReceived = 0;

    num = $scope.twitterStreamSampleNumber;
    $scope.twitterStreamSampleNumber = '';

    socket.emit('twitter stream sample', num);
    return false;
  };
  
  socket.on('twitter stream sample', function(tweet) {

    $scope.$apply(function() {
      $scope.twitterFeed.push(tweet);
      $scope.numberReceived++;
    });

    if ($scope.numberReceived === num) {
      var wordsArray = Wordcloud.createWordsArray($scope.twitterFeed);
      Wordcloud.createWordCloud(wordsArray);
    }
  });

  var topics;
  $scope.numberReceived = 0;
  $scope.topicsReceived = 0;
  $scope.numberLeftOver = 0;
  $scope.topicsNumberReceived = [];

  var wordsArray = [];

  $scope.getTwitterStreamFilter = function() {

    $scope.twitterFeed = [];
    $scope.numberReceived = 0;
    $scope.topicsReceived = 0;
    $scope.topicsNumberReceived = [];
    wordsArray = [];

    num = $scope.twitterStreamFilterNumber;
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

      if ($scope.numberReceived === num) {
        var wordsArray = Wordcloud.createWordsArray($scope.twitterFeed);
        Wordcloud.createWordCloud(wordsArray);
      }
    });
  });

  

  

  $scope.getTwitterRestUserTimeline = function() {

    $scope.twitterFeed = [];

    var screenname = $scope.twitterRestUserTimelineScreenname;
    $scope.twitterRestUserTimelineScreenname = '';

    num = $scope.twitterRestUserTimelineCount;
    $scope.twitterRestUserTimelineCount = '';

    socket.emit('twitter rest user timeline',screenname, num);
    return false;
  };

  socket.on('twitter rest user timeline', function(data) {
    $scope.$apply(function() {
      $scope.twitterFeed = data;
    });
  });

});