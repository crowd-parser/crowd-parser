var allLayersAnalysis = require('./sentiment/allLayersAnalysis');
var db = require('./database/database');

module.exports = function(io, T) {

  try {
    var TCH = require('./config/twitter_CH_private');
  } catch (e) {
    console.log(e);
    var TCH = T;
  }

  io.on('connection', function(socket) {

    // Gets top 10 trending topics.
    // This is requested on main.html page load and used for the sentiment display section
    socket.on('twitter rest trending', function() {

      T.get('trends/place', {id: 23424977}, function(err, data) {

        socket.emit('twitter rest trending', data);
      });
    });

    db.io = io;

    // Gets tweets for a search query
    // This is used for the sentiment display section
    socket.on('twitter rest search', function(query, result_type, count, max_id) {

      var params = {
        q: query,
        // Up to 100
        count: count,
        // "recent", "mixed", or "popular"
        result_type: result_type
      };

      if (max_id) {
        params.max_id = max_id;
      }

      T.get('search/tweets', params, function(err, data) {
        if (err) {
          console.log(err);
          io.emit('all layers', err);
        } else {

          // Add layer analyses to each tweet
          var allLayersResults = allLayersAnalysis.tweetsArray(data.statuses);

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
        continuousStream = TCH.stream('statuses/filter', {track: keywords, language: 'en'});

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

    // ===== THIS IS USED TO DOWNLOAD TWEETS TO THE DATABASE ====== //

    var streamDownload;

    socket.on('start download', function(rate) {
      console.log('START DOWNLOAD')
      streamDownload = T.stream('statuses/sample');
      var count = 0;
      var rate = rate || 4;

      streamDownload.on('tweet', function(tweet) {
        console.log('GOT TWEET');
        if (tweet.lang === 'en') {
          count++;
          if (count === 1 || count % rate === 0) {
            if(!db || !db.isLive){
              console.log("WAITING FOR DB");
              return;
          }
            db.executeFullChainForIncomingTweets(tweet, function(err, tweet, fields) {
              if (err) {
                console.log(err);
              } else {
                this.io.emit('tweet added', tweet);
                console.log('tweet added!', tweet.id_str);
              }
            });
          }
        }
      });

    });

    socket.on('stop download', function() {
      console.log('STOP *******************')
      streamDownload.stop();
    });



  });

};
