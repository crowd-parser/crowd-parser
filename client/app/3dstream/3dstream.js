'use strict';

angular.module('parserApp')
  .controller('3dStreamCtrl', function ($scope, Twitter, Display3d) {
    $scope.something = 3;
    Display3d.init();
    Display3d.animate();
  });