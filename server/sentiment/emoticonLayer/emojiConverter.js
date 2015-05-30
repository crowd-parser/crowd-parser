var emojiRegex = require('./emojiRegex');

// Used to convert emojis to and from characters
exports.fromCodePoint = function(codepoint) {
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

exports.toCodePoint = function(unicodeSurrogates, sep) {
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

exports.convertEmojisInTweet = function(text) {

  var emojisArray = text.match(emojiRegex());

  if (emojisArray !== null) {

    emojisArray.forEach(function(item) {
      text = text.replace(item, '<%-' + exports.toCodePoint(item) + '%>');
    });
  }

  return text;
};

exports.restoreEmojisInTweet = function(text) {

  var matchedUnicodesArray = text.match(/<%-.....%>/g);

  if (matchedUnicodesArray) {
    matchedUnicodesArray.forEach(function(item) {
      item = item.replace('<%-', '');
      item = item.replace('%>', '');
      
      text = text.replace('<%-' + item + '%>', exports.fromCodePoint(item))
    });
  }

  return text;
};