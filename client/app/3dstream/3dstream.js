'use strict';

angular.module('parserApp')
  .controller('3dStreamCtrl', function ($scope, $state, $location, Twitter, Display3d, Modal) {
    var socket = Twitter.socket;
    $scope.tweetData = [];
    $scope.tweetCount = 0;
    $scope.autoScroll = 'ON';
    $scope.numTweetsToGet = 400;
    $scope.receivingTweets = 'OFF';
    $scope.clientID = undefined;
    var runFakeTweets = false;
    var intervalID;

    $scope.editTweet = Modal.confirm.editTweet(function(x) { console.log(x); });

    if ($state.current.name === 'main.components') {
      Display3d.init('mini');
    } else {
      Display3d.init('macro', $scope);
    }

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
      if ($scope.tweetCount >= 600) {
        $scope.stopTweets();
      }
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

    $scope.autoScrollToggle = function () {
      Display3d.autoScrollToggle();
      if ($scope.autoScroll === 'ON') {
        $scope.autoScroll = 'OFF';
      } else {
        $scope.autoScroll = 'ON';
      }
    };

    $scope.streamFakeTweets = function () {
      // stop any existing stream
      socket.emit('twitter stop continuous stream');
      runFakeTweets = true;
      intervalID = setInterval(addFakeTweet, 5);
    };

    // $scope.fullScreen = function () {
    //   $scope.tweetData = [];
    //   $scope.tweetCount = 0;
    //   $scope.stopTweets();
    //   $location.path('/3dstream');
    // };

    // helper function to get clientID if we don't have one
    // and then run whatever code in cb
    var socketWithRoom = function(cb) {
      if ($scope.clientID === undefined) {
        console.log('getting ID');
        socket.emit('getID', $scope.clientID);
        socket.on('clientID', function(ID) {
          console.log('gotID: ' + ID);
          $scope.clientID = ID;
          cb();
        });
      } else {
        cb();
      }
    };

    // get REST tweets from server
    $scope.getRestTweets = function () {
      $scope.tweetData = [];
      $scope.tweetCount = 0;

      if (!$scope.keywordStream) {
        return;
      }

      socketWithRoom(function () {
        socket.emit('twitter rest search', $scope.keywordStream, 'recent', 100, null, $scope.clientID);
      });
    };
      
    // listen for REST tweets from server
    socket.on('all layers', function (data) {
      var tweets = data.tweetsWithAnalyses;
      var oldestID = tweets[tweets.length-1].id;
      $scope.tweetData = $scope.tweetData.concat(tweets);
      tweets.forEach(function (tweet) {
        Display3d.addTweet(tweet, $scope.tweetCount, $scope);
        $scope.tweetCount++;
        // tweet.addEventListener( 'click', function ( event ) {
        //   console.log(event);
        // }, false);
      });
      if ($scope.tweetData.length < $scope.numTweetsToGet) {
        socket.emit('twitter rest search', $scope.keywordStream, 'recent', 100, oldestID, $scope.clientID);
      } else {
        console.log($scope.tweetData.length);
      }
    });

    $scope.startLiveStream = function () {
      $scope.tweetData = [];
      $scope.tweetCount = 0;

      if ($scope.receivingTweets === 'OFF') {
        $scope.receivingTweets = 'ON';
      } else {
        $scope.receivingTweets = 'OFF';
      }

      // receive
      socket.on('tweet added', function (tweetFromDB) {
        if ($scope.receivingTweets === 'ON') {
          console.log('received tweet');
          console.log(tweetFromDB);
          //$scope.tweetData.push(tweetFromDB.tweet);
          var tweetFormatted = {};
          tweetFormatted.text = tweetFromDB.tweet.text;
          tweetFormatted.username = tweetFromDB.tweet.username;
          tweetFormatted.baseLayerResults = {};
          tweetFormatted.emoticonLayerResults = {};

          //Display3d.addTweet(tweetFormatted, $scope.tweetCount);
          //$scope.tweetCount++;
        }
      });
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
      $scope.receivingTweets = 'OFF';
      runFakeTweets = false;
      if (intervalID) {
        clearInterval(intervalID);
      }
    };


  });