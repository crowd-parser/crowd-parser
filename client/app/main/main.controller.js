'use strict';

angular.module('parserApp')
  .controller('MainCtrl', function ($scope, $state, Twitter) {

  // =========== Setup ============= //

  $state.transitionTo('main.frontpage3d');

  var socket = Twitter.socket;
  $scope.tweetsArray = [];

  var tweetsDisplayArray = [];
  var displayNumber;

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
      $scope.trendingArray = data[0].trends;
    });
    $scope.displayedQuery = $scope.trendingArray[Math.floor(Math.random() * 10)].name;
    
    socket.emit('twitter rest search', $scope.displayedQuery, 'mixed', 100);
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

    tweetsDisplayArray = data.tweetsWithAnalyses;

    $scope.$apply(function() {
      displayNumber = Math.floor(Math.random() * tweetsDisplayArray.length);
      $scope.allLayers = tweetsDisplayArray[displayNumber];
    });
  });

  $scope.nextTweet = function() {
    displayNumber = Math.floor(Math.random() * tweetsDisplayArray.length);
    $scope.allLayers = tweetsDisplayArray[displayNumber];
  };

  $scope.newDisplayedQuery = function(query) {
    $scope.displayedQuery = query;
    socket.emit('twitter rest search', query, 'mixed', 100);
  };

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