  $scope.startingView = true;

  var countToGet = countToGet;
  var wordsArray;
  var twitterStreamFilterTopics;

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