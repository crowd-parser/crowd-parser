var baseLayerAnalysis = require('./baseWordsLayer/baseWordsLayerAnalysis');
var emoticonLayerAnalysis = require('./emoticonLayer/emoticonLayerAnalysis');

  var allLayersAnalysis = {

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
          baseLayerResults: baseLayerAnalysis.string(tweet.text),

          // Get emoticon layer analysis result object; includes list of matching emojis and score
          emoticonLayerResults: emoticonLayerAnalysis.tweetEmoticonAnalysis(tweet.text),

          // Combined score of all layers
          overallResults: {}
        };

        // Calculation for combined score of all layers
        tweetWithAnalyses.overallResults.score = tweetWithAnalyses.baseLayerResults.score + tweetWithAnalyses.emoticonLayerResults.score;

        // Push the tweetWithAnalyses object with layer analyses to the tweetsWithAnalyses array
        results.tweetsWithAnalyses.push(tweetWithAnalyses);

      });

      return results;
    }

  };

module.exports = allLayersAnalysis;