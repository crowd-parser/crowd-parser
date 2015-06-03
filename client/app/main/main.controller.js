'use strict';

angular.module('parserApp')
  .controller('MainCtrl', function ($scope, $location, Landing) {

  $(function() {

    // Initializes the cloud cube animation
    Landing.init();
  });

  // Click handler to enter the 3D tweet visualization page
  $scope.goToDisplay = function () {
    $('#tweets-cube').remove();
    $location.path('/3dstream');
  };

  var socket = io();

  socket.on('tweet added', function(data) {
    console.log(data);
  });

});