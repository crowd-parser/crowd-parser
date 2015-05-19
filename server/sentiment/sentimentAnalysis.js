var sentimentWords = require('./sentimentWords');
var sentimentPositive = sentimentWords.sentimentPositive;
var sentimentNegative = sentimentWords.sentimentNegative;

var sentimentAnalysis = function(data) {
  var result = 0;

  if (sentimentPositive[data]) {
    result += sentimentPositive[data];
  } else if (sentimentNegative[data]) {
    result += sentimentNegative[data];
  }

  if (result > 0) {
    return 'Positive';
  } else if (result < 0) {
    return 'Negative';
  } else {
    return "Neutral";
  }
};

module.exports = sentimentAnalysis;