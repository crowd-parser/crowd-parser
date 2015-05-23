'use strict';

angular.module('parserApp')
  .controller('3dStreamCtrl', function ($scope, Twitter, Display3d) {
    var socket = Twitter.socket;
    $scope.tweetData = [];
    $scope.tweetCount = 0;

    Display3d.init();
    Display3d.animate();

    // stops stream if user leaves page
    // two options, option 1: user navigates away traditionally (close browser,
    // type in new url, use back button, refresh)
    window.onbeforeunload = function (event) {
      socket.emit('twitter stop continuous stream');
    };

    // option 2: user uses angular routes
    $scope.$on('$locationChangeStart', function (event, next, current) {
      socket.emit('twitter stop continuous stream');
    });

    $scope.start3DKeywordStream = function () {
      // stop any existing stream
      socket.emit('twitter stop continuous stream');

      // split by commas and trim whitespace
      var keywords = $scope.keywordStream.split(',');
      keywords = keywords.map(function (item) {
        return item.trim();
      });

      // emit
      socket.emit('twitter stream filter continuous', keywords);

      // receive
      socket.on('tweet results', function (tweetResult) {
        $scope.tweetData.push(tweetResult);
        Display3d.addTweet(tweetResult, $scope.tweetCount);
        $scope.tweetCount++;
      });
    };

    $scope.stopTweets = function () {
      socket.emit('twitter stop continuous stream');
    };
  });