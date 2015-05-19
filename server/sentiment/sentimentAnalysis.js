var sentimentWords = require('./sentimentWords');
var sentimentPositive = sentimentWords.sentimentPositive;
var sentimentNegative = sentimentWords.sentimentNegative;

var sentimentAnalysis = function(data) {
  var results = {};
  var totalSentimentScore = 0;
  var totalSentiment;

  data.forEach(function(text, i) {
    results[i + 1] = {};
    results[i + 1].text = text;
    results[i + 1].positiveWords = [];
    results[i + 1].negativeWords = [];
    results[i + 1].score = 0;
    text.split(' ').forEach(function(word) {
      if (sentimentPositive[word]) {
        results[i + 1].positiveWords.push([word, sentimentPositive[word]]);
        results[i + 1].score++;
      } else if (sentimentNegative[word]) {
        results[i + 1].negativeWords.push([word, sentimentNegative[word]]);
        results[i + 1].score--;
      }
      if (results[i + 1].score > 0) {
        results[i + 1].sentiment = {score: 1, sentiment: 'positive'};
      } else if (results[i + 1].score < 0) {
        results[i + 1].sentiment = {score: -1, sentiment: 'negative'};
      } else {
        results[i + 1].sentiment = {score: 0, sentiment: 'neutral'};
      }
    });
  });

  for (var key in results) {
    totalSentimentScore += results[key].sentiment.score;
    if (totalSentimentScore > 0) {
      totalSentiment = 'positive';
    } else if (totalSentimentScore < 0) {
      totalSentiment = 'negative';
    } else {
      totalSentiment = 'neutral';
    }

    results.totalSentiment = {score: totalSentimentScore, sentiment: totalSentiment};
  }

  return results;
};

module.exports = sentimentAnalysis;