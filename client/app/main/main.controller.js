'use strict';

angular.module('parserApp')
  .controller('MainCtrl', function ($scope, $location, Landing) {

  $(function() {

    // Makes the header rotate in 3D
    Landing.init();
  });

  $scope.goToDisplay = function () {
    $('#tweets-cube').remove();
    $location.path('/3dstream');
  };

  var socket = io();

  socket.on('tweet added', function(data) {
    console.log(data);
  });

});