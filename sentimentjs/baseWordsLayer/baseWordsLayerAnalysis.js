var sentimentWords = require('./baseWordsList');
var sentimentPositive = sentimentWords.sentimentPositive;
var sentimentNegative = sentimentWords.sentimentNegative;

var baseWordsLayerAnalysis = {

  string: function(string) {

    var results = {
      positiveWords: [],
      negativeWords: [],
      score: 0
    };

    string.split(' ').forEach(function(word, i) {

      var lowerCaseWord = word.toLowerCase();

      if (sentimentPositive[lowerCaseWord]) {
        results.positiveWords.push([word, i]);

        results.score++;
      } else if (sentimentNegative[lowerCaseWord]) {
        results.negativeWords.push([word, i]);

        results.score--;
      }
      if (results.score > 0) {
        results.sentiment = 'positive';
      } else if (results.score < 0) {
        results.sentiment = 'negative'
      } else {
        results.sentiment = 'neutral';
      }
    });

    return results;
  },

  stringsArray: function(stringsArray) {
    var results = {
      stringsWithAnalyses: [],
      overallScore: 0
    };
    var totalSentimentScore = 0;
    var totalSentiment;

    stringsArray.forEach(function(text, i) {
      
      var stringWithAnalysis = {
        text: text,
        positiveWords: [],
        negativeWords: [],
        score: 0
      };

      text.split(' ').forEach(function(word, i) {
        
        if (sentimentPositive[word]) {
          stringWithAnalysis.positiveWords.push([word, sentimentPositive[word]]);
          stringWithAnalysis.score++;
        
        } else if (sentimentNegative[word]) {
          stringWithAnalysis.negativeWords.push([word, sentimentNegative[word]]);
          stringWithAnalysis.score--;
        }

        if (stringWithAnalysis.score > 0) {
          results.overallScore++;
        } else if (stringWithAnalysis.score < 0) {
          results.overallScore--;
        }

      });

      results.stringsWithAnalyses.push(stringWithAnalysis);
    });
    
    return results;
  }
};

var tweetSentimentAnalysis = function(tweet) {

  var results = {
    positiveWords: [],
    negativeWords: [],
    score: 0
  };

  tweet.split(' ').forEach(function(word, i) {

    var lowerCaseWord = word.toLowerCase();

    if (sentimentPositive[lowerCaseWord]) {
      results.positiveWords.push([word, i]);

      results.score++;
    } else if (sentimentNegative[lowerCaseWord]) {
      results.negativeWords.push([word, i]);

      results.score--;
    }
    if (results.score > 0) {
      results.sentiment = 'positive';
    } else if (results.score < 0) {
      results.sentiment = 'negative'
    } else {
      results.sentiment = 'neutral';
    }
  });

  return results;
};

module.exports = baseWordsLayerAnalysis;

// exports.sentimentAnalysis = sentimentAnalysis;
// exports.tweetSentimentAnalysis = tweetSentimentAnalysis;