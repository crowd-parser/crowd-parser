var sentimentWords = require('./baseWordsList');
var sentimentPositive = sentimentWords.sentimentPositive;
var sentimentNegative = sentimentWords.sentimentNegative;

var sentimentAnalysis = function(data) {
  var results = {};
  results.tweets = [];
  var totalSentimentScore = 0;
  var totalSentiment;

  data.forEach(function(text, i) {
    var tweetSentiment = {};

    tweetSentiment.text = text;
    tweetSentiment.positiveWords = [];
    tweetSentiment.negativeWords = [];
    tweetSentiment.score = 0;
    text.split(' ').forEach(function(word, i) {
      if (sentimentPositive[word]) {
        tweetSentiment.positiveWords.push([word, sentimentPositive[word]]);
        tweetSentiment.score++;
      } else if (sentimentNegative[word]) {
        tweetSentiment.negativeWords.push([word, sentimentNegative[word]]);
        tweetSentiment.score--;
      }
      if (tweetSentiment.score > 0) {
        tweetSentiment.sentiment = {score: 1, sentiment: 'positive'};
      } else if (tweetSentiment.score < 0) {
        tweetSentiment.sentiment = {score: -1, sentiment: 'negative'};
      } else {
        tweetSentiment.sentiment = {score: 0, sentiment: 'neutral'};
      }

    });

    results.tweets.push(tweetSentiment);
  });

  results.tweets.forEach(function(tweet) {
    totalSentimentScore += tweet.sentiment.score;
    if (totalSentimentScore > 0) {
      totalSentiment = 'positive';
    } else if (totalSentimentScore < 0) {
      totalSentiment = 'negative';
    } else {
      totalSentiment = 'neutral';
    }

    results.totalSentiment = {score: totalSentimentScore, sentiment: totalSentiment};
  })
  

  return results;
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

exports.sentimentAnalysis = sentimentAnalysis;
exports.tweetSentimentAnalysis = tweetSentimentAnalysis;