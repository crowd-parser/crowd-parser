'use strict';

angular.module('parserApp')
  .controller('MainCtrl', function ($scope, $state, Header, Twitter) {

  // =========== Setup ============= //

  // Makes the header rotate in 3D
  Header.init();

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

    // Get REST search results for the randomly chosen trending topic
    Twitter.getTwitterRestSearch($scope.displayedQuery);
  });

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

  // ========== LISTENER THAT RECEIVES TWITTER DATA WITH SENTIMENT ANALYSIS RESULTS ============ //

  socket.on('all layers', function(data) {

    Twitter.addSpansToPositiveAndNegativeWords(data);

  });
});