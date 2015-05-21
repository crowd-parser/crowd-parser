var baseLayer = require('./baseLayer/sentimentAnalysis');
var emoticonLayer = require('./emoticonLayer/emoticonAnalysis');

var allLayers = function(tweetsArray) {

  var results = {};
  results.tweetsWithSentimentAnalysis = [];
  results.finalResults = {};

  var tweetWithSentimentAnalysis = {};

  tweetsArray.forEach(function(tweet) {

    tweetWithSentimentAnalysis.created_at = tweet.created_at;
    tweetWithSentimentAnalysis.id = tweet.id;
    tweetWithSentimentAnalysis.text = tweet.text;
    tweetWithSentimentAnalysis.username = tweet.user.screen_name;
    tweetWithSentimentAnalysis.followers_count = tweet.user.followers_count;

    

  });

  return results;

};

module.exports = allLayers;