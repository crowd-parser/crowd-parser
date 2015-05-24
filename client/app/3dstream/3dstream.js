'use strict';

angular.module('parserApp')
  .controller('3dStreamCtrl', function ($scope, $state, $location, Twitter, Display3d) {
    var socket = Twitter.socket;
    $scope.tweetData = [];
    $scope.tweetCount = 0;
    var runFakeTweets = false;
    var intervalID;
    var containerID = 'container-3d';
    var cameraZ;
    var cameraY;
    var displayHeight = window.innerHeight;

    if ($state.current.name === 'main.frontpage3d') {
      containerID = 'mini-container-3d';
      cameraZ = 800;
      cameraY = 100;
      displayHeight = 250;
    };

    window.camera = Display3d.init(containerID, cameraY, cameraZ, displayHeight);
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

    var fakeScore = function () {
      if (Math.random() < 0.6) {
        return 0;
      }
      return Math.round(-1 + 2 * Math.random());
    };

    var fakeText = function () {
      var length = 10 + 100 * Math.random();
      var chars = "abcdefghijklmnopqurstuvwxyz";
      var text = '';
      for (var i = 0; i < length; i++) {
        if (3 * Math.random() <= 1 && text[text.length-1] !== ' ') {
          text += ' '
        }
        text += chars[Math.floor(chars.length * Math.random())];
      }
      return text;
    };

    var addFakeTweet = function () {
      if (runFakeTweets === true) {
        var fakeTweet = {};
        fakeTweet.baseLayerResults = { score: fakeScore() };
        fakeTweet.emoticonLayerResults = { score: fakeScore() };
        fakeTweet.username = 'user' + Math.round(1000 * Math.random());
        fakeTweet.text = fakeText();
        $scope.tweetData.push(fakeTweet);
        Display3d.addTweet(fakeTweet, $scope.tweetCount);
        $scope.tweetCount++;
      }
    };

    $scope.streamFakeTweets = function () {
      // stop any existing stream
      socket.emit('twitter stop continuous stream');
      runFakeTweets = true;
      intervalID = setInterval(addFakeTweet, 500);
    };

    $scope.fullScreen = function () {
      $location.path('/3dstream');
    };

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
      runFakeTweets = false;
      if (intervalID) {
        clearInterval(intervalID);
      }
    };
  });