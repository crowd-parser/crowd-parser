'use strict';

angular.module('parserApp')
  .controller('MainCtrl', function ($scope, $state, Header, Twitter) {

  // =========== Setup ============= //

  // Makes the header rotate in 3D
  Header.init();

  // Initializes the 3D streaming view/state
  $state.transitionTo('main.components');

  // "socket" is used for socket.io events
  var socket = Twitter.socket;

  // Get top 10 trending topics on page load
  socket.emit('twitter rest trending');

  // Receives and displays trending topics on initialization
  $scope.trendingArray = [];
  socket.on('twitter rest trending', function(data) {

    // Display the array of trending topics (clickable)
    $scope.$apply(function() {
      $scope.trendingArray = data[0].trends;
    });

    // Randomly choose one of the ten trending topics to display first
    $scope.displayedQuery = $scope.trendingArray[Math.floor(Math.random() * 10)].name;

    // Get REST search results for the randomly chosen trending topic
    Twitter.getTwitterRestSearch($scope.displayedQuery);
  });

  // Array for tweets that are displayed in the "sentiment" section
  // Random tweets from this array are display, one at a time
  var tweetsDisplayArray = [];

  // This number is randomized and represents the index of the tweetsDisplayArray that will be displayed
  var displayNumber;

  $scope.suggestion = {
    tweetText: 'I don\'t hate dogs',
    problem: 'don\'t negates hate',
    suggestion: 'handle negations'
  };

  // ========== GET REQUESTS FOR TWITTER DATA =========== //

  $scope.getTwitterRestSearch = function(query) {

    $('.rest-query-input').val('');

    Twitter.getTwitterRestSearch(query);

    return false;
  };

  // Performs a REST search for the trending topic clicked on
  $scope.searchTrendingTopic = function(query) {

    Twitter.getTwitterRestSearch(query);
  };

  // Called when user selects another trending topic to get results for
  $scope.newDisplayedQuery = function(query) {

    // Update the display for the currently viewed trending topic
    $scope.displayedQuery = query;

    // Perform a new REST search for the trending topic clicked on
    socket.emit('twitter rest search', query, 'mixed', 100);
  };

  $scope.helpUsForm = false;

  // ========== LISTENER THAT RECEIVES TWITTER DATA WITH SENTIMENT ANALYSIS RESULTS ============ //

  socket.on('all layers', function(data) {

    Twitter.addSpansToPositiveAndNegativeWords(data);

    // Store the tweets in an array to be accessed one at a time to display in main.html
    tweetsDisplayArray = data.tweetsWithAnalyses;

    // Display tweets one at a time in main.html
    $scope.$apply(function() {

      // Provides a random index that will be displayed from tweetsDisplayArray
      displayNumber = Math.floor(Math.random() * tweetsDisplayArray.length);

      // Display the random tweet in main.html
      $scope.allLayers = tweetsDisplayArray[displayNumber];
    });
  });

  // Displays another random tweet from tweetsDisplayArray, avoiding repeats
  $scope.nextTweet = function() {

    // Remove the currently viewed tweet from tweetsDisplayArray
    tweetsDisplayArray.splice(displayNumber, 1);

    // Generate a new random index to display
    displayNumber = Math.floor(Math.random() * tweetsDisplayArray.length);

    // Display the new random tweet
    $scope.allLayers = tweetsDisplayArray[displayNumber];
  };
})
.directive('tweetsSentimentDisplayBand', function() {
  return {
    restrict: 'E',
    templateUrl: 'tweets-sentiment-display-band.html'
  };
});