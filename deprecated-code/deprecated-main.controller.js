  // Initializes the 3D streaming view/state
  $state.transitionTo('main.components');

  $scope.startingView = true;

  var countToGet = countToGet;
  var wordsArray;
  var twitterStreamFilterTopics;
  $scope.tweetsArray = [];

  var twitterHelpers = {
    resetStreamSample: function() {
      $scope.tweetsArray = [];
      $scope.numberReceived = 0;
    },
    resetStreamFilter: function() {
      $scope.tweetsArray = [];
      $scope.numberReceived = 0;
      $scope.topicsTotalReceived = 0;
      $scope.topicsEachReceived = [];
      wordsArray = [];
    },
    getCountToGet: function(type) {
      var count = $scope['twitterStream' + type + 'Count'];
      
      $scope['twitterStream' + type + 'Count'] = '';
      return count;
    },
    getAndCreateTwitterStreamFilterTopicsArray: function() {
      twitterStreamFilterTopics = $scope.twitterStreamFilterTopics.split(',');

      twitterStreamFilterTopics.forEach(function(topic, i) {
        $scope.topicsEachReceived[i] = {};
        $scope.topicsEachReceived[i].count = 0;
        $scope.topicsEachReceived[i].topic = topic.trim();
      });

      $scope.twitterStreamFilterTopics = '';
    },
    createWordCloudForStream: function() {
      if ($scope.numberReceived === countToGet) {
        wordsArray = Wordcloud.createWordsArray($scope.tweetsArray);
        Wordcloud.createWordCloud(wordsArray);
      }
    },
    calculateFilterRelevantTweetsCount: function(tweet, topic, i) {
      if (tweet.text.toLowerCase().indexOf(topic.toLowerCase()) !== -1) {
        $scope.topicsEachReceived[i].count++;
        $scope.topicsTotalReceived++;
      }
    },
    calculateFilterIrrelevantTweetsCount: function(totalCount, totalRelatedTweetsCount) {
      $scope.numberLeftOver = $scope.numberReceived - $scope.topicsTotalReceived;
    }
  };

  // ========= TWITTER STREAM SAMPLE ====== //

    $scope.getTwitterStreamSample = function() {

      $scope.startingView = false;

      twitterHelpers.resetStreamSample();

      countToGet = twitterHelpers.getCountToGet('Sample');

      Twitter.getTwitterStreamSample(countToGet);

      return false;
    };

    Twitter.receiveTwitterStream('sample', function(tweet) {

      $scope.$apply(function() {
        $scope.tweetsArray.push(tweet);
        $scope.numberReceived++;
      });

      $scope.tweetTest = tweet.text;

      twitterHelpers.createWordCloudForStream();
    });

    // =============== twitter-stream-filter section =========== //


    $scope.getTwitterStreamFilter = function() {

      $scope.startingView = false;

      twitterHelpers.resetStreamFilter();

      countToGet = twitterHelpers.getCountToGet('Filter');

      twitterHelpers.getAndCreateTwitterStreamFilterTopicsArray();

      Twitter.getTwitterStreamFilter(countToGet, twitterStreamFilterTopics);

      return false;
    };

    Twitter.receiveTwitterStream('filter', function(tweet) {

      $scope.$apply(function() {
        $scope.tweetsArray.push(tweet);
        $scope.numberReceived++;
        
        twitterStreamFilterTopics.forEach(function(topic, i) {

          twitterHelpers.calculateFilterRelevantTweetsCount(tweet, topic, i, i);
        });

        twitterHelpers.calculateFilterIrrelevantTweetsCount($scope.numberReceived, $scope.topicsTotalReceived);

        twitterHelpers.createWordCloudForStream();
      });
    });

    $scope.getTwitterRestUserTimeline = function() {

      $scope.startingView = false;

      $scope.tweetsArray = [];

      var screenname = $scope.twitterRestUserTimelineScreenname;
      $scope.twitterRestUserTimelineScreenname = '';

      countToGet = $scope.twitterRestUserTimelineCount;
      $scope.twitterRestUserTimelineCount = '';

      socket.emit('twitter rest user timeline',screenname, countToGet);
      return false;
    };

    socket.on('twitter rest user timeline', function(data) {
      $scope.$apply(function() {
        $scope.tweetsArray = data;
      });
    });

    socket.on('twitter rest search', function(data) {
      $scope.$apply(function() {
        $scope.tweetsArray = data.statuses;
      });
    });

    // Store the tweets in an array to be accessed one at a time to display in main.html
    tweetsDisplayArray = data.tweetsWithAnalyses;


    // Display tweets one at a time in main.html
    $scope.$apply(function() {

      // Provides a random index that will be displayed from tweetsDisplayArray
      displayNumber = Math.floor(Math.random() * tweetsDisplayArray.length);

      // Display the random tweet in main.html
      $scope.allLayers = tweetsDisplayArray[displayNumber];
    });

    // Displays another random tweet from tweetsDisplayArray, avoiding repeats
    $scope.nextTweet = function() {

      // Remove the currently viewed tweet from tweetsDisplayArray
      tweetsDisplayArray.splice(displayNumber, 1);

      // Generate a new random index to display
      displayNumber = Math.floor(Math.random() * tweetsDisplayArray.length);

      // Display the new random tweet
      $scope.allLayers = tweetsDisplayArray[displayNumber];
    };

    .directive('tweetsSentimentDisplayBand', function() {
      return {
        restrict: 'E',
        templateUrl: 'tweets-sentiment-display-band.html'
      };
    });

    // Array for tweets that are displayed in the "sentiment" section
    // Random tweets from this array are display, one at a time
    var tweetsDisplayArray = [];

    // This number is randomized and represents the index of the tweetsDisplayArray that will be displayed
    var displayNumber;

    $scope.suggestion = {
      tweetText: 'I don\'t hate dogs',
      problem: 'don\'t negates hate',
      suggestion: 'handle negations'
    };

    // Randomly choose one of the ten trending topics to display first
    $scope.displayedQuery = $scope.trendingArray[Math.floor(Math.random() * 10)].name;

    // "socket" is used for socket.io events
    var socket = Twitter.socket;

    // Get top 10 trending topics on page load
    // socket.emit('twitter rest trending');

    // Receives and displays trending topics on initialization
    $scope.trendingArray = [];
    // socket.on('twitter rest trending', function(data) {

    //   // Display the array of trending topics (clickable)
    //   $scope.$apply(function() {
    //     $scope.trendingArray = data[0].trends;
    //   });

    //   // Get REST search results for the randomly chosen trending topic
    //   Twitter.getTwitterRestSearch($scope.displayedQuery);
    // });

    // ========== GET REQUESTS FOR TWITTER DATA =========== //

    $scope.getTwitterRestSearch = function(query) {

      $('.rest-query-input').val('');

      Twitter.getTwitterRestSearch(query);

      return false;
    };

    // Performs a REST search for the trending topic clicked on
    $scope.searchTrendingTopic = function(query) {

      Twitter.getTwitterRestSearch(query);
    };

    // Called when user selects another trending topic to get results for
    $scope.newDisplayedQuery = function(query) {

      // Update the display for the currently viewed trending topic
      $scope.displayedQuery = query;

      // Perform a new REST search for the trending topic clicked on
      socket.emit('twitter rest search', query, 'mixed', 100);
    };

    $scope.goToDisplay = function () {
      $('.tweets-cube').remove();
      $location.path('/3dstream');
    };

    // ========== LISTENER THAT RECEIVES TWITTER DATA WITH SENTIMENT ANALYSIS RESULTS ============ //

    socket.on('all layers', function(data) {

      Twitter.addSpansToPositiveAndNegativeWords(data);

    });

    Twitter.getTweetsForKeyword('Obama', function(data) {
      console.log(data);
      $scope.tweetsForKeyword = data;
    });