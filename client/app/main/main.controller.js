'use strict';

angular.module('parserApp')
  .controller('MainCtrl', function ($scope, $state, Twitter, Wordcloud) {

  // =========== Setup ============= //

  $state.transitionTo('main.frontpage3d');

  $scope.startingView = true;
  var socket = Twitter.socket;
   $scope.tweetsArray = [];
  var countToGet = countToGet;
  var wordsArray;
  var twitterStreamFilterTopics;

  var twitterHelpers = {
    resetStreamSample: function() {
      $scope.tweetsArray = [];
      $scope.numberReceived = 0;
    },
    resetStreamFilter: function() {
      $scope.tweetsArray = [];
      $scope.numberReceived = 0;
      $scope.topicsTotalReceived = 0;
      $scope.topicsEachReceived = [];
      wordsArray = [];
    },
    getCountToGet: function(type) {
      var count = $scope['twitterStream' + type + 'Count'];
      
      $scope['twitterStream' + type + 'Count'] = '';
      return count;
    },
    getAndCreateTwitterStreamFilterTopicsArray: function() {
      twitterStreamFilterTopics = $scope.twitterStreamFilterTopics.split(',');

      twitterStreamFilterTopics.forEach(function(topic, i) {
        $scope.topicsEachReceived[i] = {};
        $scope.topicsEachReceived[i].count = 0;
        $scope.topicsEachReceived[i].topic = topic.trim();
      });

      $scope.twitterStreamFilterTopics = '';
    },
    createWordCloudForStream: function() {
      if ($scope.numberReceived === countToGet) {
        wordsArray = Wordcloud.createWordsArray($scope.tweetsArray);
        Wordcloud.createWordCloud(wordsArray);
      }
    },
    calculateFilterRelevantTweetsCount: function(tweet, topic, i) {
      if (tweet.text.toLowerCase().indexOf(topic.toLowerCase()) !== -1) {
        $scope.topicsEachReceived[i].count++;
        $scope.topicsTotalReceived++;
      }
    },
    calculateFilterIrrelevantTweetsCount: function(totalCount, totalRelatedTweetsCount) {
      $scope.numberLeftOver = $scope.numberReceived - $scope.topicsTotalReceived;
    }
  };

  // =========== twitter-stream-sample section ============ //

  // socket.emit('home timeline');

  // socket.on('home timeline', function(data) {
  //   console.log(data);
  //   $scope.$apply(function() {
  //     $scope.tweetsContinuousDisplay = JSON.stringify(data);
  //   });
  // });
  
  $scope.getTwitterStreamSample = function() {

    $scope.startingView = false;

    twitterHelpers.resetStreamSample();

    countToGet = twitterHelpers.getCountToGet('Sample');

    Twitter.getTwitterStreamSample(countToGet);

    return false;
  };

  Twitter.receiveTwitterStream('sample', function(tweet) {

    $scope.$apply(function() {
      $scope.tweetsArray.push(tweet);
      $scope.numberReceived++;
    });

    $scope.tweetTest = tweet.text;

    twitterHelpers.createWordCloudForStream();
  });

  // =============== twitter-stream-filter section =========== //


  $scope.getTwitterStreamFilter = function() {

    $scope.startingView = false;

    twitterHelpers.resetStreamFilter();

    countToGet = twitterHelpers.getCountToGet('Filter');

    twitterHelpers.getAndCreateTwitterStreamFilterTopicsArray();

    Twitter.getTwitterStreamFilter(countToGet, twitterStreamFilterTopics);

    return false;
  };

  Twitter.receiveTwitterStream('filter', function(tweet) {

    $scope.$apply(function() {
      $scope.tweetsArray.push(tweet);
      $scope.numberReceived++;
      
      twitterStreamFilterTopics.forEach(function(topic, i) {

        twitterHelpers.calculateFilterRelevantTweetsCount(tweet, topic, i, i);
      });

      twitterHelpers.calculateFilterIrrelevantTweetsCount($scope.numberReceived, $scope.topicsTotalReceived);

      twitterHelpers.createWordCloudForStream();
    });
  });

  // =============
  
  $scope.getTwitterRestUserTimeline = function() {

    $scope.startingView = false;

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

  $scope.getTwitterRestSearch = function() {

    $scope.startingView = false;

    $scope.tweetsArray = [];

    var query = $scope.twitterRestSearchQuery;
    $scope.twitterRestSearchQuery = '';

    var result_type = $scope.twitterRestSearchResultType;
    $scope.twitterRestSearchResultType = '';

    countToGet = $scope.twitterRestSearchCount;
    $scope.twitterRestSearchCount = '';

    socket.emit('twitter rest search',query, result_type, countToGet);
    return false;
  };

  socket.on('twitter rest search', function(data) {
    $scope.$apply(function() {
      $scope.tweetsArray = data.statuses;
    });
  });




  socket.emit('twitter rest trending');

  socket.on('twitter rest trending', function(data) {
    $scope.$apply(function() {
      $scope.trendingTopics = data[0].trends;
    });
  });

  $scope.searchTrendingTopic = function(query) {
    socket.emit('twitter rest search', query, 'mixed', 100);
  };

  socket.on('all layers', function(data) {

    data.tweetsWithAnalyses.forEach(function(tweet) {
      var textArray = tweet.text.split(' ');
      if (tweet.baseLayerResults.positiveWords) {
        tweet.baseLayerResults.positiveWords.forEach(function(word) {
          textArray[word[1]] = '<span class="positive-word">' + word[0] + '</span>';
        });
      }
      if (tweet.baseLayerResults.negativeWords) {
        tweet.baseLayerResults.negativeWords.forEach(function(word) {
          textArray[word[1]] = '<span class="negative-word">' + word[0] + '</span>';
        });
      }
      tweet.text = textArray.join(' ');
    });

    $scope.$apply(function() {
      $scope.allLayers = data;
    });
  });

  var world = document.getElementById( 'world' );
  var d = 0;
  var worldXAngle = 0;
  var worldYAngle = 0;

  $('.viewport').on( 'mousemove', function( e ) {
    worldYAngle = -( .5 - ( e.clientX / window.innerWidth ) ) * 180;
    worldXAngle = ( .5 - ( e.clientY / window.innerHeight ) ) * 180;
    //worldXAngle = .1 * ( e.clientY - .5 * window.innerHeight );
    //worldYAngle = .1 * ( e.clientX - .5 * window.innerWidth );
    updateView();
  } );

  function updateView() {
    var t = 'translateZ( ' + d + 'px ) rotateX( ' + worldXAngle + 'deg) rotateY( ' + worldYAngle + 'deg)';
    world.style.webkitTransform =
    world.style.MozTransform =
    world.style.oTransform = 
    world.style.transform = t;
  }
});