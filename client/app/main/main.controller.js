'use strict';

angular.module('parserApp')
  .controller('MainCtrl', function ($scope, $location, Landing) {

  // Makes the header rotate in 3D
  Landing.init();

  $scope.goToDisplay = function () {
    $('.tweets-cube').remove();
    $location.path('/3dstream');
  };

});