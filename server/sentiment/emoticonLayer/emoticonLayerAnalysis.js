var em = require('./emoticonsList');
var emojiRegex = require('./emojiRegex');

var emojiConverter = require('./emojiConverter');

module.exports = function(string) {

  if (typeof string !== 'string') {
    string = string.text;
  }

  // Initialize results object with what we want in theh end
  var results = {
    positiveWords: [],
    negativeWords: [],
    unknown: [],
    score: 0
  };

  // Create an array of the emojis in the string
  var emojis = string.match(emojiRegex());

  // Character representation of emoji
  var itemCode;

  if (emojis) {

    // check each emoji against emoticon list
    emojis.forEach(function(item) {

      // Convert emoji to characters
      itemCode = toCodePoint(item);

      // If emoji is in the positive emoticons list, add to positive words array
      if (itemCode in em.positive) {
        results.positiveWords.push(item);

        // Increment the final score of the string
        results.score++;

      // If emoji is in the negative emoticons list, add to negative words array
      } else if (toCodePoint(item) in em.negative) {
        results.negativeWords.push(item);

        // Decrement the final score of the string
        results.score--;

      } else {
        // If not in either table, store it in 'unknown' array so we know what we missed
        results.unknown.push(item);
      }
    });
  }

  return results;
};


// Used to convert emojis to and from characters
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
