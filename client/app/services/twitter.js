'use strict';

angular.module('parserApp.twitterService', [])

.factory('Twitter', function ($http, $window) {

  // ========== Setup =============== //

  var socket = io();

  var getTweetsForKeyword = function(keyword, cb) {
    $http.get('/database/getTweetsForKeyword')
      .success(function(data) {
        cb(data);
      });
  };

  var getTwitterRestSearch = function(query) {
    socket.emit('twitter rest search', query, 'mixed', 100);
  };

  var addSpansToPositiveAndNegativeWords = function(data) {

    // Add spans for positive and negative words for each tweet for styling purposes
    data.tweetsWithAnalyses.forEach(function(tweet) {

      // Split the text of each tweet into individual words
      var textArray = tweet.text.split(' ');

      // Check if tweet contains positive words from the base words layer analysis
      if (tweet.baseLayerResults.positiveWords) {

        // For each positive word in the tweet, add a "positive-word" span
        tweet.baseLayerResults.positiveWords.forEach(function(word) {
          textArray[word[1]] = '<span class="positive-word">' + word[0] + '</span>';
        });
      }

      // Check if tweet contains positive words from the base words layer analysis
      if (tweet.baseLayerResults.negativeWords) {

        // For each positive word in the tweet, add a "positive-word" span
        tweet.baseLayerResults.negativeWords.forEach(function(word) {
          textArray[word[1]] = '<span class="negative-word">' + word[0] + '</span>';
        });
      }

      // Join the tweet back together
      tweet.text = textArray.join(' ');
    });
  };

  return {
    socket: socket,

    getTweetsForKeyword: getTweetsForKeyword,

    getTwitterRestSearch: getTwitterRestSearch,

    addSpansToPositiveAndNegativeWords: addSpansToPositiveAndNegativeWords
  };
});