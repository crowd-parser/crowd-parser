var em = require('./emoticonsList');
var emojiRegex = require('./emojiRegex');

var emoticonAnalysis = function(data) {

  var results = {};
  results.tweets = [];
  var itemCode;
  results.totalScore = 0;

  data.forEach(function (text, i) {
    var tweetSentiment = {
      score: 0,
      text: text,
      positiveEmojis: [],
      negativeEmojis: [],
      hadEmojis: false,
      unknown: []
    };

    // use emojiRegex to grab array of all emojis in string
    var emojis = text.match(emojiRegex());

    if (emojis) {
      // check each emoji against emoticonData table
      emojis.forEach(function(item) {
        itemCode = toCodePoint(item);
        if (itemCode in em.positive) {
          tweetSentiment.score += em.positive[itemCode];
          tweetSentiment.positiveEmojis.push(item);
        } else if (toCodePoint(item) in em.negative) {
          tweetSentiment.score += em.negative[itemCode];
          tweetSentiment.negativeEmojis.push(item);
        } else {
          // if not in either table, store it in 'unknown'
          // array so we know what we missed
          tweetSentiment.unknown.push(item);
        }
      });
    }
    results.totalScore += tweetSentiment.score;
    results.tweets.push(tweetSentiment);
  });


  if (results.totalScore > 0) {
    results.emojiSentiment = 'positive';
  } else if (results.totalScore < 0) {
    results.emojiSentiment = 'negative';
  } else {
    results.emojiSentiment = 'neutral';
  }

  return results;

};

var tweetEmoticonAnalysis = function(tweet) {

  var results = {
    positiveWords: [],
    negativeWords: [],
    unknown: [],
    hadEmojis: false,
    score: 0
  };

  var emojis = tweet.match(emojiRegex());

  var itemCode;

  if (emojis) {
    // check each emoji against emoticonData table
    emojis.forEach(function(item) {
      itemCode = toCodePoint(item);
      if (itemCode in em.positive) {
        results.score += em.positive[itemCode];

        results.positiveWords.push(item);
      } else if (toCodePoint(item) in em.negative) {
        results.score += em.negative[itemCode];

        results.negativeWords.push(item);
      } else {
        // if not in either table, store it in 'unknown'
        // array so we know what we missed
        results.unknown.push(item);
      }
    });
  }

  if (results.score > 0) {
    results.sentiment = 'positive';
  } else if (results.score < 0) {
    results.sentiment = 'negative';
  } else {
    results.sentiment = 'neutral';
  }

  return results;

};

function fromCodePoint(codepoint) {
  var code = typeof codepoint === 'string' ?
        parseInt(codepoint, 16) : codepoint;
  if (code < 0x10000) {
    return String.fromCharCode(code);
  }
  code -= 0x10000;
  return String.fromCharCode(
    0xD800 + (code >> 10),
    0xDC00 + (code & 0x3FF)
  );
}

function toCodePoint(unicodeSurrogates, sep) {
  var
    r = [],
    c = 0,
    p = 0,
    i = 0;
  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++);
    if (p) {
      r.push((0x10000 + ((p - 0xD800) << 10) + (c - 0xDC00)).toString(16));
      p = 0;
    } else if (0xD800 <= c && c <= 0xDBFF) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join(sep || '-');
}

exports.emoticonAnalysis = emoticonAnalysis;
exports.tweetEmoticonAnalysis = tweetEmoticonAnalysis;