var sentimentWords = require('./baseWordsList');
var sentimentPositive = sentimentWords.sentimentPositive;
var sentimentNegative = sentimentWords.sentimentNegative;

module.exports = function(string) {

  // Initialize results object with what we want in the end
  var results = {
    positiveWords: [],
    negativeWords: [],
    score: 0
  };

  // Perform the base words layer analysis on the string
  string.split(' ').forEach(function(word, i) {

    // Make a lowercase copy of each word to compare against the base words library
    var lowerCaseWord = word.toLowerCase();

    // If the copied word matches a positive word in the library, add the original word to the positive words array
    if (sentimentPositive[lowerCaseWord]) {
      results.positiveWords.push([word, i]);

      // Increment the final score of the string
      results.score++;

    // If the copied word matches a negative word in the library, add the original word to the negative words array  
    } else if (sentimentNegative[lowerCaseWord]) {
      results.negativeWords.push([word, i]);

      // Decrement the final score of the string
      results.score--;
    }
  });

  return results;
};