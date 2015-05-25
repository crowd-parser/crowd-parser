'use strict';

angular.module('parserApp')
  .controller('DBPanelCtrl', function ($http, $scope, $state, Twitter, Auth) {

    Auth.checkAuth();

    var socket = Twitter.socket;

    $http.get('/auth/adminlogin/getTables').success(function(data) {
      $scope.dbtables = data;
    });

    $scope.showTableSize = function(tableName) {
      $http.post('/auth/adminlogin/showTableSize', {tableName: tableName}).success(function(data) {
        $scope.tableBeingViewed = tableName;
        $scope.tableSize = data;
      });
    };

    $scope.showAllKeywords = function() {
      $http.get('/auth/adminlogin/showAllKeywords')
        .success(function(data) {
          console.log(data);
          $scope.keywordsList = data;
        });
    };

    $scope.startDownload = function() {

      var rate = $scope.streamDownloadRate;
      $scope.streamDownloadRate = '';

      socket.emit('start download', rate);

    };

    $scope.stopDownload = function() {
      socket.emit('stop download');
    };

    socket.on('tweet added', function(data) {
      $scope.$apply(function() {
        $scope.tweetAdded = 'Tweet added! --> ID: ' + data;
      });
    });

    $scope.addNewLayer = function() {

    };

    $scope.redoLayer = function() {

    };

    $scope.deleteLayer = function() {

    };

    $scope.addNewKeyword = function() {

    };

    $scope.redoKeyword = function() {

    };

    $scope.deleteKeyword = function() {

    };

    $scope.createDatabase = function() {

    };

    $scope.changeToDatabase = function() {

    };

    $scope.logout = function() {
      localStorage.removeItem('com.crowdparser');
      $state.transitionTo('main');
    };
  });