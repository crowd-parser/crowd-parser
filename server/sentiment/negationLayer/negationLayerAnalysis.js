var negationWords = require('./negationList');
var _ = require('underscore')._;
var baseWords = require('../baseWordsLayer/baseWordsList');
var TreebankWordTokenizer = require('../modules/tokenizers/treebank_word_tokenizer');

module.exports = function(string) {

  if (typeof string !== 'string') {
    string = string.text;
  }

  // Initialize results object with what we want in the end
  var results = {
    negationWordsIndexes: [],
    positiveWords: [],
    negativeWords: [],
    score: 0
  };
  var tokenizer = new TreebankWordTokenizer();

  var pureStringArray = tokenizer.tokenize(string);
  var modString = string;

  _.each(negationWords, function (word, key) {
    var re = new RegExp(key, 'gi');
    modString = modString.replace(re, word);
  });


  var words = tokenizer.tokenize(modString);
  words = _.map(words, function (word) {
    if (word[0] !== '~') {
      return word.toLowerCase();
    } else {
      return word;
    }
  });
  var negScope = false;


  _.each(words, function (word, i, words) {
    // skip pseudo negatives
    if (word !== '~PSEU~') {
      // if word is a pre-condition negative
      if (word === '~PREN~') {
        // flip negScope
        negScope = !negScope;
        results.negationWordsIndexes.push([pureStringArray[i], i]);
        // if word is a termination term
      } else if (word === '~CONJ~') {
        negScope = false;
        // if there is a post-condition negative 5 or less words ahead 
      } else if (words[i+5] === '~POST~' || words[i+4] === '~POST~'||
           words[i+3] === '~POST~' || words[i+2] === '~POST~' || words[i+1] === '~POST~') {
        negScope = true;
        // if end of sentence
      } else if (word === '.') {
        negScope = false;
        // otherwise if it's not a negation keyword
      } else {
        if (baseWords.sentimentPositive[word] && !negScope) {
          results.positiveWords.push([word, i]);
          results.score++;
        }
        if (baseWords.sentimentNegative[word] && !negScope) {
          results.negativeWords.push([word, i]);
          results.score--;
        }
        if (baseWords.sentimentPositive[word] && negScope) {
          results.negativeWords.push([word, i]);
          results.score--;
        }
        if (baseWords.sentimentNegative[word] && negScope) {
          results.positiveWords.push([word, i]);
          results.score++;
        }
      }
    }
  });

  // // Perform the base words layer analysis on the string
  // string.split(' ').forEach(function(word, i) {

  //   // Make a lowercase copy of each word to compare against the negation words library
  //   var lowerCaseWord = word.toLowerCase().replace(/[\.\!]/g, '');

  //   if (baseWords.sentimentPositive[lowerCaseWord] || negationWords[lowerCaseWord]) {
      
  //     if (baseWords.sentimentNegative[string.split(' ')[i - 1]]) {
  //       results.negatedPositives.push([word, i]);
  //       results.score--;
  //     }
    
  //   // If the copied word matches a word in the negation library, add the word to the negation words array
  //   } else if (negationWords[lowerCaseWord]) {
  //     results.negationWords.push([word, i]);

  //     // Decrement the final score of the string, since negation words are generally intrinsically negative
  //     results.score--;
  //   }

    
  // });

  return results;
};
