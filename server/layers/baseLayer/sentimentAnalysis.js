var sentimentWords = require('./sentimentWords');
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
    text.split(' ').forEach(function(word) {
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

  var tweetSentimentAnalysisResults = {};

  tweetSentimentAnalysisResults.positiveWords = [];
  tweetSentimentAnalysisResults.negativeWords = [];
  tweetSentimentAnalysisResults.score = 0;

  tweet.split(' ').forEach(function(word) {
    if (sentimentPositive[word]) {
      tweetSentimentAnalysisResults.positiveWords.push(word);

      tweetSentimentAnalysisResults.score++;
    } else if (sentimentNegative[word]) {
      tweetSentimentAnalysisResults.negativeWords.push(word);

      tweetSentimentAnalysisResults.score--;
    }
    if (tweetSentimentAnalysisResults.score > 0) {
      tweetSentimentAnalysisResults.sentiment = 'positive';
    } else if (tweetSentimentAnalysisResults.score < 0) {
      tweetSentimentAnalysisResults.sentiment = 'negative'
    } else {
      tweetSentimentAnalysisResults.sentiment = 'neutral';
    }
  });

  return tweetSentimentAnalysisResults;
};

exports.sentimentAnalysis = sentimentAnalysis;
exports.tweetSentimentAnalysis = tweetSentimentAnalysis;

// var results = {
//   tweetsWithSentimentResults: [
//   {
//     created_at:
//     text: 
//     followersCount:
//     baseLayerResults: {
//       positiveWords: ['word1', 'word2'],
//       negativeWords: ['word1']
//       baseLayerFinalScore: {
//         score: 1,
//         sentiment: positive
//       }
//     },
//     emojiLayerResults: {
//       positiveEmojis: ['emoji1'],
//       negativeEmojis: ['emoji1', 'emoji2', 'emoji3'],
//       emojiLayerFinalScore: {
//         score: -2,
//         sentiment: negative
//       }
//     },
//     combinedLayerResults: {
//       positives: ['word1', 'word2', 'emoji1'],
//       negatives: ['word1', 'emoji1', 'emoji2', 'emoji3'],
//       combinedTotalScore: {
//         score: -1,
//         sentiment: negative
//       }
//     }
//   },
//   {
//     **** SAME AS ABOVE ******
//   }
//   ],
//   cumulativeResults: {
//     cumulativeBaseLayerResults: {
//       positiveTweets: 325,
//       negativeTweets: 230,
//       cumulativeBaseLayerSentiment: 'positive'/'slightly positive'...
//     },
//     cumulativeEmojiLayerResults: {
//       ****** SAME AS ABOVE *******
//     }
//     cumulativeResults: {
//       ***** SAME AS ABOVE *******
//     }
//   }
// }