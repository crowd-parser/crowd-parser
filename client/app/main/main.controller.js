'use strict';

angular.module('parserApp')
  .controller('MainCtrl', function ($scope, Twitter, Wordcloud) {

  var socket = Twitter.socket;
   $scope.tweetsArray = Twitter.tweetsArray;
  var countToGet = countToGet;
  
  $scope.getTwitterStreamSample = function() {

    $scope.tweetsArray = [];
    $scope.numberReceived = 0;

    countToGet = $scope.twitterStreamSampleCount;
    $scope.twitterStreamSampleCount = '';

    socket.emit('twitter stream sample', countToGet);
    return false;
  };
  
  socket.on('twitter stream sample', function(tweet) {

    $scope.$apply(function() {
      $scope.tweetsArray.push(tweet);
      $scope.numberReceived++;
    });

    if ($scope.numberReceived === countToGet) {
      var wordsArray = Wordcloud.createWordsArray($scope.tweetsArray);
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

    $scope.tweetsArray = [];
    $scope.numberReceived = 0;
    $scope.topicsReceived = 0;
    $scope.topicsNumberReceived = [];
    wordsArray = [];

    countToGet = $scope.twitterStreamFilterCount;
    $scope.twitterStreamFilterCount = '';

    

    topics = $scope.twitterStreamFilterTopics.split(',');

    topics.forEach(function(topic, i) {
      $scope.topicsNumberReceived[i] = {};
      $scope.topicsNumberReceived[i].count = 0;
      $scope.topicsNumberReceived[i].topic = topic.trim();
    });

    $scope.twitterStreamFilterTopics = '';

    socket.emit('twitter stream filter', countToGet, topics);
    return false;
  };

  socket.on('twitter stream filter', function(tweet) {

    $scope.$apply(function() {
      $scope.tweetsArray.push(tweet);
      $scope.numberReceived++;
      topics.forEach(function(topic, i) {

        if (tweet.text.toLowerCase().indexOf(topic.toLowerCase()) !== -1) {
          $scope.topicsNumberReceived[i].count++;
          $scope.topicsReceived++;
        }
      });
      $scope.numberLeftOver = $scope.numberReceived - $scope.topicsReceived;

      if ($scope.numberReceived === countToGet) {
        var wordsArray = Wordcloud.createWordsArray($scope.tweetsArray);
        Wordcloud.createWordCloud(wordsArray);
      }
    });
  });

  

  

  $scope.getTwitterRestUserTimeline = function() {

    $scope.tweetsArray = [];

    var screenname = $scope.twitterRestUserTimelineScreenname;
    $scope.twitterRestUserTimelineScreenname = '';

    countToGet = $scope.twitterRestUserTimelineCount;
    $scope.twitterRestUserTimelineCount = '';

    socket.emit('twitter rest user timeline',screenname, countToGet);
    return false;
  };

  socket.on('twitter rest user timeline', function(data) {
    $scope.$apply(function() {
      $scope.tweetsArray = data;
    });
  });

});