var sentiment = require('./layers/baseLayer/sentimentAnalysis');
var emojiAnalysis = require('./layers/emoticonLayer/emoticonAnalysis');

var allLayers = require('./layers/allLayers');

module.exports = function(io, T) {



  io.on('connection', function(socket) {
    
    socket.on('twitter stream sample', function(num) {

      var count = 0;
      var target = num || 20;
      var tweetsSentimentArray = [];
      var twemojiTextArray = [];

      var tweetsArray = [];
      
      var stream = T.stream('statuses/sample');

      stream.on('tweet', function(tweet) {

        if (tweet.lang === 'en') {
          io.emit('twitter stream sample', tweet);
          count++;

          tweetsArray.push(tweet);
        }

        if (count === target) {
          stream.stop();

          var allLayersResults = allLayers(tweetsArray);
          
          io.emit('all layers', allLayersResults);
        }
      });
    });

    socket.on('twitter stream filter', function(num, topics) {

      var count = 0;
      var target = num || 20;
      var tweetsArray = [];

      var stream = T.stream('statuses/filter', {track: topics, language: 'en'});

      stream.on('tweet', function(tweet) {
        io.emit('twitter stream filter', tweet);
        
        count++;
        
        tweetsArray.push(tweet);
          
        if (count === target) {
          stream.stop();

          var allLayersResults = allLayers(tweetsArray);
          
          io.emit('all layers', allLayersResults);
        }
      });
    });

    socket.on('twitter rest user timeline', function(screen_name, count) {
      T.get('statuses/user_timeline', {screen_name: screen_name, count: count}, function(err, data) {
        socket.emit('twitter rest user timeline', data);

        var allLayersResults = allLayers(data);
        
        io.emit('all layers', allLayersResults);

      });
    });

    socket.on('twitter rest search', function(query, result_type, count) {
      T.get('search/tweets', {q: query, count: count, result_type: result_type}, function(err, data) {
        socket.emit('twitter rest search', data);

        var allLayersResults = allLayers(data.statuses);
                  
        io.emit('all layers', allLayersResults);
      });
    });

    socket.on('twitter rest trending', function() {
      T.get('trends/place', {id: 23424977}, function(err, data) {
        socket.emit('twitter rest trending', data);
      });
    });

  });

};