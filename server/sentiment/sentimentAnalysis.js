var sentimentWords = require('./sentimentWords');
var sentimentPositive = sentimentWords.sentimentPositive;
var sentimentNegative = sentimentWords.sentimentNegative;

var sentimentAnalysis = function(data) {
  var results = {};
  results.finalScore = 0;

  data.forEach(function(text, i) {
    results[i + 1] = {};
    results[i + 1].text = text;
    results[i + 1].positiveWords = [];
    results[i + 1].negativeWords = [];
    text.split(' ').forEach(function(word) {
      if (sentimentPositive[word]) {
        results[i + 1].positiveWords.push([word, sentimentPositive[word]]);
        results.finalScore += sentimentPositive[word];
      } else if (sentimentNegative[word]) {
        results[i + 1].negativeWords.push([word, sentimentNegative[word]]);
        results.finalScore += sentimentNegative[word];
      }
    });
  });

  return results;
};

module.exports = sentimentAnalysis;