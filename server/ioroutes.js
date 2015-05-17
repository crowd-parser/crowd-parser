module.exports = function(io, T) {

  io.on('connection', function(socket) {
    
    socket.on('twitter stream sample', function(num) {

      var count = 0;
      var target = num || 20;
      
      var stream = T.stream('statuses/sample');

      stream.on('tweet', function(tweet) {

        if (tweet.lang === 'en') {
          io.emit('twitter stream sample', tweet);
          count++;
        }

        if (count === target) {
          stream.stop();
        }
      });
    });

    socket.on('twitter stream filter', function(num, topics) {

      var count = 0;
      var target = num || 20;

      var stream = T.stream('statuses/filter', {track: topics, language: 'en'});

      stream.on('tweet', function(tweet) {
        io.emit('twitter stream filter', tweet);
        
        count++;

        if (count === target) {
          stream.stop();
        }
      });
    });

    socket.on('twitter rest user timeline', function(screen_name, count) {
      T.get('statuses/user_timeline', {screen_name: screen_name, count: count}, function(err, data) {
        socket.emit('twitter rest user timeline', data);
      });
    });

    socket.on('twitter rest search', function(query, result_type, count) {
      T.get('search/tweets', {q: query, result_type: result_type, count: count}, function(err, data) {
        socket.emit('twitter rest search', data);
      });
    });

  });

};