var sentimentWords = require('./sentimentWords');
var sentimentPositive = sentimentWords.sentimentPositive;
var sentimentNegative = sentimentWords.sentimentNegative;

var sentimentAnalysis = function(data) {
  var result = 0;

  data.forEach(function(item) {
    item.split(' ').forEach(function(word) {
      if (sentimentPositive[word]) {
        result += sentimentPositive[word];
      } else if (sentimentNegative[word]) {
        result += sentimentNegative[word];
      }
    });
  });

  if (result > 0) {
    console.log('Positive');
    return 'Positive';
  } else if (result < 0) {
    console.log('Negative');
    return 'Negative';
  } else {
    console.log('Neutral');
    return "Neutral";
  }
};

module.exports = sentimentAnalysis;