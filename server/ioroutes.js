var sentiment = require('./sentiment/sentimentAnalysis');

module.exports = function(io, T) {



  io.on('connection', function(socket) {
    
    socket.on('twitter stream sample', function(num) {

      var count = 0;
      var target = num || 20;
      var tweetsSentimentArray = [];
      
      var stream = T.stream('statuses/sample');

      stream.on('tweet', function(tweet) {

        if (tweet.lang === 'en') {
          io.emit('twitter stream sample', tweet);
          count++;
          tweetsSentimentArray.push(tweet.text);
        }

        if (count === target) {
          stream.stop();
          
          var sentimentResult = sentiment(tweetsSentimentArray);

          io.emit('sentiment', sentimentResult);
        }
      });
    });

    socket.on('twitter stream filter', function(num, topics) {

      var count = 0;
      var target = num || 20;
      var tweetsSentimentArray = [];

      var stream = T.stream('statuses/filter', {track: topics, language: 'en'});

      stream.on('tweet', function(tweet) {
        io.emit('twitter stream filter', tweet);
        
        count++;
        tweetsSentimentArray.push(tweet.text);

        if (count === target) {
          stream.stop();

          var sentimentResult = sentiment(tweetsSentimentArray);

          io.emit('sentiment', sentimentResult);
        }
      });
    });

    socket.on('twitter rest user timeline', function(screen_name, count) {
      T.get('statuses/user_timeline', {screen_name: screen_name, count: count}, function(err, data) {
        socket.emit('twitter rest user timeline', data);

        var tweetsSentimentArray = data.map(function(tweet) {
          return tweet.text;
        });

        var sentimentResult = sentiment(tweetsSentimentArray);

        io.emit('sentiment', sentimentResult);

      });
    });

    socket.on('twitter rest search', function(query, result_type, count) {
      T.get('search/tweets', {q: query, count: count, result_type: result_type}, function(err, data) {
        socket.emit('twitter rest search', data);

        var tweetsSentimentArray = data.statuses.map(function(tweet) {
          return tweet.text;
        });

        var sentimentResult = sentiment(tweetsSentimentArray);

        io.emit('sentiment', sentimentResult);
      });
    });

    socket.on('twitter rest trending', function() {
      T.get('trends/place', {id: 1}, function(err, data) {
        socket.emit('twitter rest trending', data);
      });
    });

  });

};