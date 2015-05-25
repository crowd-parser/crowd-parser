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

socket.on('twitter rest user timeline', function(screen_name, count) {
  T.get('statuses/user_timeline', {screen_name: screen_name, count: count}, function(err, data) {
    socket.emit('twitter rest user timeline', data);

    var allLayersResults = allLayersAnalysis.tweetsArray(data);
    
    io.emit('all layers', allLayersResults);

  });
});

socket.on('home timeline', function() {
  T.get('statuses/home_timeline', {count: 50}, function(err, data) {
    console.log(data);
    var allLayersResults = allLayersAnalysis.tweetsArray(data);
              
    io.emit('all layers', allLayersResults);

    // socket.emit('home timeline', data);
  });
});