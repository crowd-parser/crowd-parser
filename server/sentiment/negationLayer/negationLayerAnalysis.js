var negationWords = require('./negationList');

var baseWords = require('../baseWordsLayer/baseWordsList');

module.exports = function(string) {

  // Initialize results object with what we want in the end
  var results = {
    negationWords: [],
    negatedPositives: [],
    score: 0
  };

  // Perform the base words layer analysis on the string
  string.split(' ').forEach(function(word, i) {

    

    // Make a lowercase copy of each word to compare against the negation words library
    var lowerCaseWord = word.toLowerCase().replace(/[\.\!]/g, '');

    if (baseWords.sentimentPositive[lowerCaseWord] || negationWords[lowerCaseWord]) {
      
      if (baseWords.sentimentNegative[string.split(' ')[i - 1]]) {
        results.negatedPositives.push([word, i]);
        results.score--;
      }
    
    // If the copied word matches a word in the negation library, add the word to the negation words array
    } else if (negationWords[lowerCaseWord]) {
      results.negationWords.push([word, i]);

      // Decrement the final score of the string, since negation words are generally intrinsically negative
      results.score--;
    }

    
  });

  return results;
};

console.log(module.exports('not cool'));