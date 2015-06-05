'use strict';

angular.module('parserApp')
  .controller('MainCtrl', function ($scope, $location, Landing, Twitter) {

  $(function() {

    // Initializes the cloud cube animation
    Landing.init();
  });

  // Click handler to enter the 3D tweet visualization page
  $scope.goToDisplay = function () {
    $('#tweets-cube').remove();
    $location.path('/3dstream');
  };

  Twitter.getTweetsCount(function(data) {
    $scope.tweetsCount = data;
  });

});