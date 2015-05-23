var allLayersAnalysis = require('./sentiment/allLayersAnalysis');

module.exports = function(io, T) {

  io.on('connection', function(socket) {
    
    // Receives a constant sample stream of twitter statuses
    socket.on('twitter stream sample', function(num) {

      // Counter used to track how many tweets have been received
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

          var allLayersResults = allLayersAnalysis.tweetsArray(tweetsArray);
          
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

          var allLayersResults = allLayersAnalysis.tweetsArray(tweetsArray);
          
          io.emit('all layers', allLayersResults);
        }
      });
    });

    // need var outside so I can find it and stop it later
    var continuousStream;
    // start continuous stream to client
    socket.on('twitter stream filter continuous', function(keywords) {
      console.log(keywords);

      if (keywords) {
        continuousStream = T.stream('statuses/filter', {track: keywords, language: 'en'});

        continuousStream.on('tweet', function(tweet) {
          var tweetResults = allLayersAnalysis.tweetsArray([tweet]).tweetsWithAnalyses[0];
          io.emit('tweet results', tweetResults);
        });
      }

    });

    // stop continuous stream on request from client
    socket.on('twitter stop continuous stream', function() {
      if (continuousStream) {
        continuousStream.stop();
      }
    });

    socket.on('twitter rest user timeline', function(screen_name, count) {
      T.get('statuses/user_timeline', {screen_name: screen_name, count: count}, function(err, data) {
        socket.emit('twitter rest user timeline', data);

        var allLayersResults = allLayersAnalysis.tweetsArray(data);
        
        io.emit('all layers', allLayersResults);

      });
    });

    socket.on('twitter rest search', function(query, result_type, count) {
      T.get('search/tweets', {q: query, count: count, result_type: result_type}, function(err, data) {
        socket.emit('twitter rest search', data);

        var allLayersResults = allLayersAnalysis.tweetsArray(data.statuses);
                  
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