var Twit = require('twit');

var T = new Twit({
  consumer_key: 'ENTER YOURS HERE', 
  consumer_secret: 'ENTER YOURS HERE', 
  access_token: 'ENTER YOURS HERE', 
  access_token_secret: 'ENTER YOURS HERE'
});

module.exports = T;