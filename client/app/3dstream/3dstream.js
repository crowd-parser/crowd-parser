'use strict';

angular.module('parserApp')
  .controller('3dStreamCtrl', function ($scope, $state, $location, $timeout, Twitter, Display3d, Modal) {
    var socket = Twitter.socket;
    $scope.tweetData = [];
    $scope.tweetCount = 0;
    $scope.autoScroll = 'ON';
    $scope.numTweetsToGet = 400;
    $scope.receivingTweets = 'OFF';
    $scope.clientID = undefined;
    $scope.showLayerMenu = false;
    $scope.allLayers = {};
    $scope.layers = [];
    $scope.radio = {};
    $scope.layersVisible = {};
    $scope.gettingKeywordTweets = false;
    $scope.keywordTimeout = false;
    var liveStreamStarted = false;
    var expectedKeywordTweets = 0;
    var runFakeTweets = false;
    var intervalID;

    $scope.grayedOut = function () {
      return $scope.gettingKeywordTweets;
    };

    $scope.editTweet = Modal.confirm.editTweet(function(x) { console.log(x); });

    if ($state.current.name === 'main.components') {
      Display3d.init('mini');
    } else {
      Display3d.init('macro', $scope);
    }

    Display3d.animate();

    // fake layers for test
    // $scope.layers = [
    //   {title: 'word'},
    //   {title: 'emoji'},
    //   {title: 'cat'},
    //   {title: 'dog'}
    // ];

    // check all boxes on
    for (var layer in $scope.allLayers) {
      $scope.layers.push($scope.allLayers[layer].layer);
    }

    $scope.layers.forEach(function (layer) {
      $scope.layersVisible[layer.title] = { viz: true };
    });

    $scope.clearSolo = function () {
      // clear solo
      for (var layer in $scope.layersVisible) {
        $scope.layersVisible[layer].solo = false;
      }
      Display3d.updateLayers($scope.layersVisible);
    };

    $scope.soloLayer = function (layerToSolo) {
      for (var layer in $scope.layersVisible) {
        if (layer !== layerToSolo) {
          $scope.layersVisible[layer].viz = false;
          $scope.layersVisible[layer].solo = false;
        } else {
          $scope.layersVisible[layer].viz = true;
        }
      }
      Display3d.updateLayers($scope.layersVisible);
    };

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

    // var fakeScore = function () {
    //   if (Math.random() < 0.6) {
    //     return 0;
    //   }
    //   return Math.round(-1 + 2 * Math.random());
    // };

    // var fakeText = function () {
    //   var length = 10 + 100 * Math.random();
    //   var chars = "abcdefghijklmnopqurstuvwxyz";
    //   var text = '';
    //   for (var i = 0; i < length; i++) {
    //     if (3 * Math.random() <= 1 && text[text.length-1] !== ' ') {
    //       text += ' '
    //     }
    //     text += chars[Math.floor(chars.length * Math.random())];
    //   }
    //   return text;
    // };

    // var addFakeTweet = function () {
    //   if ($scope.tweetCount >= 600) {
    //     $scope.stopTweets();
    //   }
    //   if (runFakeTweets === true) {
    //     var fakeTweet = {};
    //     fakeTweet.baseLayerResults = { score: fakeScore() };
    //     fakeTweet.emoticonLayerResults = { score: fakeScore() };
    //     fakeTweet.username = 'user' + Math.round(1000 * Math.random());
    //     fakeTweet.text = fakeText();
    //     $scope.tweetData.push(fakeTweet);
    //     Display3d.addTweet(fakeTweet, $scope.tweetCount);
    //     $scope.tweetCount++;
    //   }
    // };

    $scope.autoScrollToggle = function () {
      Display3d.autoScrollToggle();
      if ($scope.autoScroll === 'ON') {
        $scope.autoScroll = 'OFF';
      } else {
        $scope.autoScroll = 'ON';
      }
    };

    $scope.toggleLayerMenu = function () {
      $scope.showLayerMenu = !$scope.showLayerMenu;
    };

    // $scope.streamFakeTweets = function () {
    //   // stop any existing stream
    //   socket.emit('twitter stop continuous stream');
    //   runFakeTweets = true;
    //   intervalID = setInterval(addFakeTweet, 5);
    // };

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

    var formatTweetObject = function(tweetObj) {
      var tweetFormatted = {};
      tweetFormatted.text = tweetObj.tweet.text;
      tweetFormatted.username = tweetObj.tweet.user_name;
      tweetFormatted.timestamp = tweetObj.tweet.timestamp_ms;
      tweetFormatted.baseLayerResults = tweetObj.layers.Base;
      if (tweetObj.layers.Base) {
        tweetFormatted.baseLayerResults.negativeWords = JSON.parse(tweetObj.layers.Base.negativeWords);
        tweetFormatted.baseLayerResults.positiveWords = JSON.parse(tweetObj.layers.Base.positiveWords);
      }
      tweetFormatted.emoticonLayerResults = tweetObj.layers.Emoticons;
      if (tweetObj.layers.Emoticons) {
        tweetFormatted.emoticonLayerResults.negativeWords = JSON.parse(tweetObj.layers.Emoticons.negativeWords);
        tweetFormatted.emoticonLayerResults.positiveWords = JSON.parse(tweetObj.layers.Emoticons.positiveWords);
      }
      tweetFormatted.slangLayerResults = tweetObj.layers.Slang;
      if (tweetObj.layers.Slang) {
        tweetFormatted.slangLayerResults.negativeWords = JSON.parse(tweetObj.layers.Slang.negativeWords);
        tweetFormatted.slangLayerResults.positiveWords = JSON.parse(tweetObj.layers.Slang.positiveWords);
      }
      tweetFormatted.negationLayerResults = tweetObj.layers.Negation;
      if (tweetObj.layers.Negation) {
        tweetFormatted.negationLayerResults.negativeWords = JSON.parse(tweetObj.layers.Negation.negativeWords);
        tweetFormatted.negationLayerResults.positiveWords = JSON.parse(tweetObj.layers.Negation.positiveWords);
      }
      return tweetFormatted;
    };

    $scope.startLiveStream = function () {
      if (liveStreamStarted === false) {
        $scope.tweetData = [];
        $scope.tweetCount = 0;
      }

      if ($scope.receivingTweets === 'OFF') {
        $scope.receivingTweets = 'ON';
      } else {
        $scope.receivingTweets = 'OFF';
      }

      // receive live stream
      if (liveStreamStarted === false) {
        liveStreamStarted = true;
      
        socket.on('tweet added', function (tweetsFromDB) {
          if ($scope.receivingTweets === 'ON') {
            console.log('received tweet');
            console.log(tweetsFromDB);

            var tweetIDs = Object.keys(tweetsFromDB);
            tweetIDs.sort();
            for (var i = 0; i < tweetIDs.length; i++) {
              var tweetObj = tweetsFromDB[tweetIDs[i]];
              var tweetFormatted = formatTweetObject(tweetObj);
              $scope.tweetData.push(tweetFormatted);
              Display3d.addTweet(tweetFormatted, $scope.tweetCount);
              $scope.tweetCount++;
            }
          }
        });
      }
    };

    var sortTweetsByDate = function () {
      $scope.tweetData.sort(function (a,b) {
        if (a.timestamp < b.timestamp) {
          return -1;
        }
        if (a.timestamp > b.timestamp) {
          return 1;
        }
        return 0;
      });
    };

    $scope.requestTweetsByKeyword = function (keyword) {
      liveStreamStarted = false;

      // gray out button until all tweets retrieved
      $scope.gettingKeywordTweets = true;

      $scope.tweetData = [];
      $scope.tweetCount = 0;

      socketWithRoom(function () {
        socket.emit('tweet keyword', keyword, $scope.clientID);
      });
    };

    socket.on('tweet keyword response', function (tweetsFromDB) {
      console.log('received tweet');
      console.log(tweetsFromDB);
      var timeoutPromise;

      // if server is telling how many tweets to expect
      if (typeof tweetsFromDB !== 'object') {
        expectedKeywordTweets = +tweetsFromDB;
      } else {
        // start a timeout timer (cancel any existing one first)
        if (timeoutPromise) {
          $timeout.cancel(timeoutPromise);
        }
        timeoutPromise = $timeout( function() { 
          console.log('timed out, displaying keyword tweets');
          $scope.gettingKeywordTweets = false;
          displayAllTweets();
         }, 3000);
        // still getting tweets, store tweets
        var tweetIDs = Object.keys(tweetsFromDB);
        console.log(tweetIDs.length);
        for (var i = 0; i < tweetIDs.length; i++) {
          var tweetObj = tweetsFromDB[tweetIDs[i]];
          var tweetFormatted = formatTweetObject(tweetObj);
          $scope.tweetData.push(tweetFormatted);
          $scope.tweetCount++;
          // Display3d.addTweet(tweetFormatted, $scope.tweetCount);
        }
        console.log($scope.tweetCount);
        // if we got all the tweets we were expecting
        if ($scope.tweetCount >= expectedKeywordTweets) {
          // cancel timeout
          if (timeoutPromise) {
            $timeout.cancel(timeoutPromise);
          }
          console.log('received all keyword tweets');
          $scope.gettingKeywordTweets = false;
          displayAllTweets();
        }
      }
    });

    function displayAllTweets() {
      sortTweetsByDate();
      $scope.tweetData.forEach(function (tweet, i) {
        Display3d.addTweet(tweet, i, $scope);
      });
    }

    // $scope.start3DKeywordStream = function () {
    //   // stop any existing stream
    //   socket.emit('twitter stop continuous stream');

    //   // split by commas and trim whitespace
    //   var keywords = $scope.keywordStream.split(',');
    //   keywords = keywords.map(function (item) {
    //     return item.trim();
    //   });

    //   // emit
    //   socket.emit('twitter stream filter continuous', keywords);

    //   // receive
    //   socket.on('tweet results', function (tweetResult) {
    //     $scope.tweetData.push(tweetResult);
    //     Display3d.addTweet(tweetResult, $scope.tweetCount);
    //     $scope.tweetCount++;
    //   });
    // };

    $scope.stopTweets = function () {
      socket.emit('twitter stop continuous stream');
      $scope.receivingTweets = 'OFF';
      runFakeTweets = false;
      if (intervalID) {
        clearInterval(intervalID);
      }
    };


  });