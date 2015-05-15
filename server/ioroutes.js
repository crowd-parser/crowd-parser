module.exports = function(io, T) {

  io.on('connection', function(socket) {
    
    socket.on('twitter stream sample', function(num) {

      var count = 0;
      var target = num || 20;
      
      var stream = T.stream('statuses/sample');

      stream.on('tweet', function(tweet) {
        io.emit('twitter stream sample', tweet);
        
        count++;

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

  });

};