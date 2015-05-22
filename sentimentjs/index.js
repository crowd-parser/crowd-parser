// This is a copy of allLayersAnalysis.js for the NPM package.
// We didn't want to change the descriptive name for our app

var baseLayerAnalysis = require('./baseWordsLayer/baseWordsLayerAnalysis');
var emoticonLayerAnalysis = require('./emoticonLayer/emoticonLayerAnalysis');

  var allLayersAnalysis = {

    // This function accepts tweet objects from Twitter's API
    // To input an array of strings, use the function below
    tweetsArray: function(tweetsArray) {

      // Final results object to be returned
      var results = {};

      // Array that includes each tweet along with its various sentiment analyses
      results.tweetsWithAnalyses = [];

      // Run each layer of analyses on each tweet
      tweetsArray.forEach(function(tweet) {

        // Each tweet is represented by an object with metadata and results from each layer analysis
        var tweetWithAnalyses = {
          // Metadata for tweet
          created_at: tweet.created_at,
          id: tweet.id,
          text: tweet.text,
          username: tweet.user.screen_name,
          followers_count: tweet.user.followers_count,

          // Get base layer analysis result object; includes list of matching words and score
          baseLayerResults: baseLayerAnalysis(tweet.text),

          // Get emoticon layer analysis result object; includes list of matching emojis and score
          emoticonLayerResults: emoticonLayerAnalysis(tweet.text),

          // Combined score of all layers
          overallResults: {}
        };

        // Calculation for combined score of all layers
        tweetWithAnalyses.overallResults.score = tweetWithAnalyses.baseLayerResults.score + tweetWithAnalyses.emoticonLayerResults.score;

        // Push the tweetWithAnalyses object with layer analyses to the tweetsWithAnalyses array
        results.tweetsWithAnalyses.push(tweetWithAnalyses);

      });

      return results;
    },

    // This function is for general sentiment analysis usage.
    // The app uses the tweet version to store some information unique to tweets
    stringsArray: function(stringsArray) {

      // Final results object to be returned
      var results = {};

      // Array that includes each string along with its various sentiment analyses
      results.stringsWithAnalyses = [];

      // Run each layer of analyses on each string
      stringsArray.forEach(function(string) {

        // Each string is represented by an object with metadata and results from each layer analysis
        var stringsWithAnalyses = {
          // Metadata for string
          text: string,

          // Get base layer analysis result object; includes list of matching words and score
          baseLayerResults: baseLayerAnalysis(string),

          // Get emoticon layer analysis result object; includes list of matching emojis and score
          emoticonLayerResults: emoticonLayerAnalysis(string),

          // Combined score of all layers
          overallResults: {}
        };

        // Calculation for combined score of all layers
        stringsWithAnalyses.overallResults.score = stringsWithAnalyses.baseLayerResults.score + stringsWithAnalyses.emoticonLayerResults.score;

        // Push the stringsWithAnalyses object with layer analyses to the stringsWithAnalyses array
        results.stringsWithAnalyses.push(stringsWithAnalyses);

      });

      return results;
    }
  };

module.exports = allLayersAnalysis;