'use strict';

angular.module('parserApp')
  .controller('DBPanelCtrl', function ($scope, $state, Twitter, Auth) {

    Auth.checkAuth();

    var socket = Twitter.socket;

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

    $scope.logout = function() {
      localStorage.removeItem('com.crowdparser');
      $state.transitionTo('main');
    };
  });