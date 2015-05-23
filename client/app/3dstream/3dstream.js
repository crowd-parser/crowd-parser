'use strict';

angular.module('parserApp')
  .controller('3dStreamCtrl', function ($scope, Twitter, Display3d) {
    Display3d.init();
    Display3d.animate();

    $scope.start3DKeywordStream = function () {
      console.log ($scope.keywordStream);
    };
  });